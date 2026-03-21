import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, CheckCheck, ShoppingCart, X, Filter, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  order_id: string | null;
  created_at: string;
}

type StatusFilter = "all" | "unread" | "read";
type TypeFilter = "all" | "order";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (statusFilter === "unread" && n.read) return false;
    if (statusFilter === "read" && !n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    const channel = supabase
      .channel("admin-notifications-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newNotif.title, {
              body: newNotif.message || "",
              icon: "/pwa-192x192.png",
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase.from("admin_notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.order_id) { navigate("/admin/pedidos"); setOpen(false); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return <ShoppingCart className="w-4 h-4 text-primary" />;
      case "restock": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const chipClass = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-foreground hover:text-primary transition-colors p-2 rounded-xl hover:bg-primary/10"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-bold text-foreground">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-2 border-b border-border/50 flex flex-wrap gap-1.5">
              <button className={chipClass(statusFilter === "all")} onClick={() => setStatusFilter("all")}>Todas</button>
              <button className={chipClass(statusFilter === "unread")} onClick={() => setStatusFilter("unread")}>Não lidas</button>
              <button className={chipClass(statusFilter === "read")} onClick={() => setStatusFilter("read")}>Lidas</button>
              <span className="w-px h-5 bg-border self-center mx-1" />
              <button className={chipClass(typeFilter === "all")} onClick={() => setTypeFilter("all")}>Todos tipos</button>
              <button className={chipClass(typeFilter === "order")} onClick={() => setTypeFilter("order")}>Pedidos</button>
              <button className={chipClass(typeFilter === "restock" as any)} onClick={() => setTypeFilter("restock" as any)}>Reposição</button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhuma notificação encontrada
                </div>
              ) : (
                filtered.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {notif.message && <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.message}</p>}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!notif.read && <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
