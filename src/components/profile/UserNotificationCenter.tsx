import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Bell, Check, CheckCheck, X, Filter, Package, Gift, Star,
  Info, ShoppingCart, Clock, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

type StatusFilter = "all" | "unread";

export default function UserNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (statusFilter === "unread" && n.read) return false;
    return true;
  });

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data as UserNotification[]);
    };
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("user-notifications-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as UserNotification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newNotif.title, {
              body: newNotif.message || "",
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Delay to not be intrusive
      const timer = setTimeout(() => Notification.requestPermission(), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string) => {
    await supabase.from("user_notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase.from("user_notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return <Package className="w-4 h-4 text-primary" />;
      case "coupon": return <Gift className="w-4 h-4 text-rose-500" />;
      case "points": return <Star className="w-4 h-4 text-amber-500" />;
      case "restock": return <Clock className="w-4 h-4 text-sky-500" />;
      case "achievement": return <Sparkles className="w-4 h-4 text-violet-500" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const chipClass = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`;

  if (!user) return null;

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
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
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
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notificações
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="px-4 py-2 border-b border-border/50 flex gap-1.5">
              <button className={chipClass(statusFilter === "all")} onClick={() => setStatusFilter("all")}>
                Todas ({notifications.length})
              </button>
              <button className={chipClass(statusFilter === "unread")} onClick={() => setStatusFilter("unread")}>
                Não lidas ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma notificação</p>
                  <p className="text-xs mt-1">Você será notificado sobre pedidos, cupons e pontos.</p>
                </div>
              ) : (
                filtered.map((notif, i) => (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => markAsRead(notif.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0 ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!notif.read && <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
