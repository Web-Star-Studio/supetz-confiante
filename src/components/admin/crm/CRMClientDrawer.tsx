import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Star, Send, Tag, Plus, Trash2, MessageSquare,
  ArrowRightLeft, Clock, Crown, UserCheck, UserPlus, UserX,
  Brain, Bell, Package, Gift, Ticket, CalendarDays, Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedClient } from "./CRMClientList";

interface Props {
  client: EnrichedClient | null;
  onClose: () => void;
  allTags: { id: string; name: string; color: string }[];
  onRefresh: () => void;
}

const statusOptions = [
  { key: "lead", label: "Lead", icon: UserPlus, color: "text-blue-600" },
  { key: "active", label: "Ativo", icon: UserCheck, color: "text-emerald-600" },
  { key: "inactive", label: "Inativo", icon: UserX, color: "text-amber-600" },
  { key: "vip", label: "VIP", icon: Crown, color: "text-violet-600" },
];

interface AICredit {
  id: string;
  days_granted: number;
  expires_at: string;
  granted_at: string;
}

interface OrderInfo {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
}

interface CouponInfo {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  used: boolean;
  expires_at: string | null;
}

export default function CRMClientDrawer({ client, onClose, allTags, onRefresh }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [interactions, setInteractions] = useState<{ id: string; type: string; description: string | null; created_at: string; metadata?: any }[]>([]);
  const [pets, setPets] = useState<{ id: string; name: string; breed: string | null }[]>([]);
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [coupons, setCoupons] = useState<CouponInfo[]>([]);
  const [aiCredits, setAICredits] = useState<AICredit[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "ai" | "notify">("overview");

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [sendingNotif, setSendingNotif] = useState(false);

  // AI credit form
  const [grantDays, setGrantDays] = useState(30);
  const [grantingAI, setGrantingAI] = useState(false);

  useEffect(() => {
    if (!client || !client.user_id) return;
    const uid = client.user_id;

    Promise.all([
      supabase.from("customer_notes").select("id, content, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      supabase.from("customer_interactions").select("id, type, description, created_at, metadata").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
      supabase.from("pets").select("id, name, breed").eq("user_id", uid),
      supabase.from("orders").select("id, total, status, created_at, items").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      supabase.from("user_coupons").select("id, code, discount_type, discount_value, used, expires_at").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("ai_access_credits").select("id, days_granted, expires_at, granted_at").eq("user_id", uid).order("granted_at", { ascending: false }),
    ]).then(([notesRes, intRes, petsRes, ordersRes, couponsRes, aiRes]) => {
      setNotes((notesRes.data as any[]) || []);
      setInteractions((intRes.data as any[]) || []);
      setPets((petsRes.data as any[]) || []);
      setOrders((ordersRes.data as any[]) || []);
      setCoupons((couponsRes.data as any[]) || []);
      setAICredits((aiRes.data as any[]) || []);
    });
  }, [client]);

  if (!client) return null;

  const avgTicket = client.orderCount > 0 ? client.totalSpent / client.orderCount : 0;
  const isNewsletterOnly = !client.user_id;

  // AI access status
  const now = new Date();
  const activeCredits = aiCredits.filter(c => new Date(c.expires_at) > now);
  const latestExpiry = activeCredits.length > 0
    ? new Date(Math.max(...activeCredits.map(c => new Date(c.expires_at).getTime())))
    : null;
  const hasAIAccess = !!latestExpiry;
  const daysRemaining = latestExpiry ? Math.ceil((latestExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  async function handleAddNote() {
    if (!newNote.trim() || !user) return;
    setSaving(true);
    await supabase.from("customer_notes").insert({ user_id: client!.user_id, admin_id: user.id, content: newNote.trim() });
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "note", description: newNote.trim() });
    setNewNote("");
    const { data } = await supabase.from("customer_notes").select("id, content, created_at").eq("user_id", client!.user_id).order("created_at", { ascending: false }).limit(20);
    setNotes((data as any[]) || []);
    const { data: intData } = await supabase.from("customer_interactions").select("id, type, description, created_at, metadata").eq("user_id", client!.user_id).order("created_at", { ascending: false }).limit(50);
    setInteractions((intData as any[]) || []);
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    await supabase.from("customer_status").upsert({ user_id: client!.user_id, status: newStatus, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "status_change", description: `Status alterado para ${newStatus}` });
    onRefresh();
  }

  async function handleToggleTag(tagId: string) {
    const hasTag = client!.tags.some((t) => t.id === tagId);
    if (hasTag) {
      await supabase.from("customer_tag_assignments").delete().eq("user_id", client!.user_id).eq("tag_id", tagId);
    } else {
      await supabase.from("customer_tag_assignments").insert({ user_id: client!.user_id, tag_id: tagId });
    }
    const tagName = allTags.find((t) => t.id === tagId)?.name || "";
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "tag_change", description: `${hasTag ? "Removida" : "Adicionada"} tag: ${tagName}` });
    onRefresh();
  }

  async function handleSendNotification() {
    if (!notifTitle.trim() || !client?.user_id) return;
    setSendingNotif(true);
    const { error } = await supabase.from("user_notifications").insert({
      user_id: client.user_id,
      title: notifTitle.trim(),
      message: notifMessage.trim() || null,
      type: notifType,
      link: null,
    });
    if (error) {
      toast.error("Erro ao enviar notificação");
    } else {
      toast.success("Notificação enviada!");
      await supabase.from("customer_interactions").insert({
        user_id: client.user_id,
        type: "contact",
        description: `Notificação enviada: ${notifTitle.trim()}`,
      });
      setNotifTitle("");
      setNotifMessage("");
    }
    setSendingNotif(false);
  }

  async function handleGrantAIAccess() {
    if (!client?.user_id || grantDays <= 0) return;
    setGrantingAI(true);
    const latestExp = aiCredits.length > 0
      ? new Date(Math.max(...aiCredits.map(c => new Date(c.expires_at).getTime())))
      : now;
    const newStart = latestExp > now ? latestExp : now;
    const expiresAt = new Date(newStart.getTime() + grantDays * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("ai_access_credits").insert({
      user_id: client.user_id,
      days_granted: grantDays,
      expires_at: expiresAt.toISOString(),
    } as any);

    if (error) {
      toast.error("Erro ao conceder acesso à IA");
    } else {
      toast.success(`${grantDays} dias de acesso à IA concedidos!`);
      await supabase.from("customer_interactions").insert({
        user_id: client.user_id,
        type: "ai_grant",
        description: `Concedido ${grantDays} dias de acesso à Super Pet IA`,
      });
      // Refresh credits
      const { data } = await supabase.from("ai_access_credits").select("id, days_granted, expires_at, granted_at").eq("user_id", client.user_id).order("granted_at", { ascending: false });
      setAICredits((data as any[]) || []);
    }
    setGrantingAI(false);
  }

  const interactionIcons: Record<string, typeof ShoppingBag> = {
    purchase: ShoppingBag,
    note: MessageSquare,
    status_change: ArrowRightLeft,
    tag_change: Tag,
    contact: Bell,
    support: Star,
    ai_grant: Brain,
  };

  const orderStatusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const tabs = [
    { key: "overview" as const, label: "Resumo", icon: UserCheck },
    { key: "history" as const, label: "Histórico", icon: Clock },
    { key: "ai" as const, label: "Super Pet IA", icon: Brain },
    { key: "notify" as const, label: "Notificar", icon: Bell },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-supet-text/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-xl bg-supet-bg z-50 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-supet-bg/95 backdrop-blur-lg z-10 p-6 pb-3 border-b border-border/50">
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {(client.full_name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-extrabold text-foreground">{client.full_name || "Sem nome"}</h2>
              <p className="text-sm text-muted-foreground">{client.phone || "Sem telefone"}</p>
              {hasAIAccess && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-600">
                  <Brain className="w-3 h-3" /> IA ativa — {daysRemaining}d restantes
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!isNewsletterOnly && (
            <div className="flex gap-1 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* ============= OVERVIEW TAB ============= */}
          {activeTab === "overview" && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="text-sm font-extrabold text-foreground">R$ {client.totalSpent.toFixed(0)}</p>
                </div>
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                  <p className="text-sm font-extrabold text-foreground">R$ {avgTicket.toFixed(0)}</p>
                </div>
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-sm font-extrabold text-foreground">{client.orderCount}</p>
                </div>
              </div>

              {/* Extra metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pontos</p>
                  <p className="text-sm font-extrabold text-foreground">{client.totalPoints}</p>
                </div>
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Cupons</p>
                  <p className="text-sm font-extrabold text-foreground">{coupons.length}</p>
                </div>
                <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pets</p>
                  <p className="text-sm font-extrabold text-foreground">{pets.length}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Status do funil</p>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleStatusChange(s.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        client.status === s.key
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-supet-bg-alt text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {allTags.map((tag) => {
                    const isAssigned = client.tags.some((t) => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleToggleTag(tag.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isAssigned ? "shadow-sm" : "opacity-40 hover:opacity-80"
                        }`}
                        style={{ backgroundColor: tag.color + (isAssigned ? "33" : "11"), color: tag.color }}
                      >
                        {isAssigned ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pets */}
              {pets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Pets cadastrados</p>
                  <div className="flex gap-2 flex-wrap">
                    {pets.map((pet) => (
                      <span key={pet.id} className="bg-supet-bg-alt px-3 py-1.5 rounded-full text-xs font-semibold text-foreground">
                        🐾 {pet.name}{pet.breed ? ` (${pet.breed})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Notas internas</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                    placeholder="Adicionar nota..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={saving || !newNote.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-supet-bg-alt rounded-2xl p-3 text-xs">
                      <p className="text-foreground">{note.content}</p>
                      <p className="text-muted-foreground mt-1">{new Date(note.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ============= HISTORY TAB ============= */}
          {activeTab === "history" && (
            <>
              {/* Orders */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Pedidos ({orders.length})
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {orders.map((order) => {
                    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                    return (
                      <div key={order.id} className="bg-supet-bg-alt rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            R$ {Number(order.total).toFixed(2)} — {itemCount} {itemCount === 1 ? "item" : "itens"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          order.status === "delivered" ? "bg-emerald-500/15 text-emerald-700"
                            : order.status === "cancelled" ? "bg-red-500/15 text-red-700"
                            : "bg-amber-500/15 text-amber-700"
                        }`}>
                          {orderStatusLabels[order.status] || order.status}
                        </span>
                      </div>
                    );
                  })}
                  {orders.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum pedido registrado</p>}
                </div>
              </div>

              {/* Coupons */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" /> Cupons ({coupons.length})
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-supet-bg-alt rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground font-mono">{coupon.code}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} de desconto
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        coupon.used ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-700"
                      }`}>
                        {coupon.used ? "Usado" : "Ativo"}
                      </span>
                    </div>
                  ))}
                  {coupons.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum cupom</p>}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Timeline de interações
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {interactions.map((int) => {
                    const Icon = interactionIcons[int.type] || Clock;
                    return (
                      <div key={int.id} className="flex items-start gap-3 bg-supet-bg-alt rounded-2xl p-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">{int.description || int.type}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(int.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })}
                  {interactions.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem interações registradas</p>}
                </div>
              </div>
            </>
          )}

          {/* ============= AI TAB ============= */}
          {activeTab === "ai" && (
            <>
              {/* AI Status */}
              <div className={`rounded-2xl p-5 border ${hasAIAccess ? "bg-violet-500/5 border-violet-500/20" : "bg-supet-bg-alt border-border/50"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasAIAccess ? "bg-violet-500/15" : "bg-muted"}`}>
                    <Brain className={`w-5 h-5 ${hasAIAccess ? "text-violet-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{hasAIAccess ? "Acesso ativo" : "Sem acesso"}</p>
                    {hasAIAccess && latestExpiry && (
                      <p className="text-xs text-muted-foreground">
                        Expira em {latestExpiry.toLocaleDateString("pt-BR")} ({daysRemaining} dias)
                      </p>
                    )}
                  </div>
                </div>

                {/* Grant access */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={grantDays}
                    onChange={(e) => setGrantDays(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">dias</span>
                  <button
                    onClick={handleGrantAIAccess}
                    disabled={grantingAI || grantDays <= 0}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {grantingAI ? "Concedendo..." : "Conceder acesso"}
                  </button>
                </div>
              </div>

              {/* Credit history */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico de créditos IA</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiCredits.map((credit) => {
                    const expired = new Date(credit.expires_at) < now;
                    return (
                      <div key={credit.id} className={`bg-supet-bg-alt rounded-2xl p-3 flex items-center gap-3 ${expired ? "opacity-50" : ""}`}>
                        <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{credit.days_granted} dias concedidos</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(credit.granted_at).toLocaleDateString("pt-BR")} → {new Date(credit.expires_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${expired ? "bg-muted text-muted-foreground" : "bg-violet-500/15 text-violet-600"}`}>
                          {expired ? "Expirado" : "Ativo"}
                        </span>
                      </div>
                    );
                  })}
                  {aiCredits.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum crédito de IA registrado</p>}
                </div>
              </div>
            </>
          )}

          {/* ============= NOTIFY TAB ============= */}
          {activeTab === "notify" && (
            <>
              <div className="bg-supet-bg-alt rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Enviar notificação</p>
                    <p className="text-xs text-muted-foreground">Será exibida na central de notificações do usuário</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "info", label: "Informação", emoji: "ℹ️" },
                      { key: "promo", label: "Promoção", emoji: "🎉" },
                      { key: "order", label: "Pedido", emoji: "📦" },
                      { key: "alert", label: "Alerta", emoji: "⚠️" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setNotifType(t.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          notifType === t.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título *</label>
                  <input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Ex: Temos uma surpresa para você!"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem (opcional)</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Detalhes da notificação..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotif || !notifTitle.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  {sendingNotif ? "Enviando..." : "Enviar notificação"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
