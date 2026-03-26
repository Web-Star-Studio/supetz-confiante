import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, Send, Eye, Users, Tag, Percent,
  DollarSign, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Mail,
} from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import NewsletterTab from "@/components/admin/NewsletterTab";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  segment_filter: any;
  message: string | null;
  coupon_discount_type: string | null;
  coupon_discount_value: number | null;
  coupon_min_order: number | null;
  coupon_expires_days: number | null;
  recipients_count: number;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
}

interface CampaignWithMetrics extends Campaign {
  opened: number;
  total: number;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; class: string }> = {
  draft: { label: "Rascunho", icon: Clock, class: "bg-muted text-muted-foreground" },
  active: { label: "Enviada", icon: Send, class: "bg-emerald-500/15 text-emerald-700" },
  completed: { label: "Concluída", icon: CheckCircle, class: "bg-blue-500/15 text-blue-700" },
  cancelled: { label: "Cancelada", icon: XCircle, class: "bg-destructive/15 text-destructive" },
};

export default function AdminMarketing() {
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns" | "newsletter">("campaigns");

  // Form state
  const [form, setForm] = useState({
    name: "",
    type: "notification" as "notification" | "coupon" | "both",
    message: "",
    coupon_discount_type: "percentage" as "percentage" | "fixed",
    coupon_discount_value: 10,
    coupon_min_order: 50,
    coupon_expires_days: 30,
    segment_status: "" as string,
    segment_tag: "" as string,
    segment_min_spent: "",
    segment_days_inactive: "",
  });

  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const [campRes, recipRes, tagsRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("campaign_recipients").select("campaign_id, opened"),
      supabase.from("customer_tags").select("*").order("name"),
    ]);

    const camps = (campRes.data || []) as Campaign[];
    const recipients = recipRes.data || [];
    setAllTags((tagsRes.data || []) as any[]);

    const enriched: CampaignWithMetrics[] = camps.map((c) => {
      const recs = recipients.filter((r: any) => r.campaign_id === c.id);
      return { ...c, total: recs.length, opened: recs.filter((r: any) => r.opened).length };
    });

    setCampaigns(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function buildSegmentFilter() {
    const filter: any = {};
    if (form.segment_status) filter.status = form.segment_status;
    if (form.segment_tag) filter.tag_id = form.segment_tag;
    if (form.segment_min_spent) filter.min_spent = Number(form.segment_min_spent);
    if (form.segment_days_inactive) filter.days_inactive = Number(form.segment_days_inactive);
    return filter;
  }

  async function previewSegment() {
    // Count matching clients
    let query = supabase.from("profiles").select("user_id", { count: "exact", head: true });

    if (form.segment_status) {
      const { data: statusData } = await supabase.from("customer_status").select("user_id").eq("status", form.segment_status);
      const ids = (statusData || []).map((s: any) => s.user_id);
      if (ids.length === 0) { setPreviewCount(0); return; }
      query = query.in("user_id", ids);
    }

    if (form.segment_tag) {
      const { data: tagData } = await supabase.from("customer_tag_assignments").select("user_id").eq("tag_id", form.segment_tag);
      const ids = (tagData || []).map((t: any) => t.user_id);
      if (ids.length === 0) { setPreviewCount(0); return; }
      query = query.in("user_id", ids);
    }

    const { count } = await query;
    setPreviewCount(count || 0);
  }

  async function handleSendCampaign() {
    if (!form.name.trim() || !form.message.trim()) return;
    setSending(true);

    const segmentFilter = await buildSegmentFilter();

    // Get target user_ids
    let userIds: string[] = [];
    let query = supabase.from("profiles").select("user_id");

    if (form.segment_status) {
      const { data: statusData } = await supabase.from("customer_status").select("user_id").eq("status", form.segment_status);
      const ids = (statusData || []).map((s: any) => s.user_id);
      if (ids.length > 0) query = query.in("user_id", ids);
      else { toast.warning("Nenhum cliente encontrado para este segmento"); setSending(false); return; }
    }

    if (form.segment_tag) {
      const { data: tagData } = await supabase.from("customer_tag_assignments").select("user_id").eq("tag_id", form.segment_tag);
      const ids = (tagData || []).map((t: any) => t.user_id);
      if (ids.length > 0) query = query.in("user_id", ids);
      else { toast.warning("Nenhum cliente encontrado para esta tag"); setSending(false); return; }
    }

    const { data: profilesData } = await query;
    userIds = (profilesData || []).map((p: any) => p.user_id);

    if (form.segment_min_spent) {
      const { data: ordersData } = await supabase.from("orders").select("user_id, total");
      const spentMap: Record<string, number> = {};
      (ordersData || []).forEach((o: any) => {
        spentMap[o.user_id] = (spentMap[o.user_id] || 0) + Number(o.total);
      });
      userIds = userIds.filter((uid) => (spentMap[uid] || 0) >= Number(form.segment_min_spent));
    }

    if (userIds.length === 0) { toast.warning("Nenhum cliente encontrado para este segmento"); setSending(false); return; }

    // Create campaign
    const { data: campData } = await supabase.from("campaigns").insert({
      name: form.name,
      type: form.type,
      message: form.message,
      segment_filter: segmentFilter,
      status: "active",
      sent_at: new Date().toISOString(),
      recipients_count: userIds.length,
      ...(form.type !== "notification" ? {
        coupon_discount_type: form.coupon_discount_type,
        coupon_discount_value: form.coupon_discount_value,
        coupon_min_order: form.coupon_min_order,
        coupon_expires_days: form.coupon_expires_days,
      } : {}),
    }).select().single();

    if (!campData) { setSending(false); return; }
    log({ action: "create", entity_type: "campaign", entity_id: campData.id, details: { name: form.name, type: form.type, recipients: userIds.length } });

    // Send notifications and/or coupons to each user
    for (const uid of userIds) {
      let couponId: string | null = null;

      if (form.type === "coupon" || form.type === "both") {
        const code = `CAMP-${form.name.replace(/\s+/g, "").slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { data: couponData } = await supabase.from("user_coupons").insert({
          user_id: uid,
          code,
          discount_type: form.coupon_discount_type,
          discount_value: form.coupon_discount_value,
          min_order_value: form.coupon_min_order,
          expires_at: new Date(Date.now() + form.coupon_expires_days * 86400000).toISOString(),
        }).select().single();
        couponId = couponData?.id || null;
      }

      if (form.type === "notification" || form.type === "both") {
        await supabase.from("user_notifications").insert({
          user_id: uid,
          title: `📢 ${form.name}`,
          message: form.message,
          type: "campaign",
          link: "/shop",
        });
      }

      await supabase.from("campaign_recipients").insert({
        campaign_id: (campData as any).id,
        user_id: uid,
        coupon_id: couponId,
      });
    }

    // Reset
    setForm({ name: "", type: "notification", message: "", coupon_discount_type: "percentage", coupon_discount_value: 10, coupon_min_order: 50, coupon_expires_days: 30, segment_status: "", segment_tag: "", segment_min_spent: "", segment_days_inactive: "" });
    setShowCreate(false);
    setPreviewCount(null);
    setSending(false);
    fetchCampaigns();
  }

  const totalSent = campaigns.filter((c) => c.status !== "draft").reduce((s, c) => s + c.total, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Marketing</h1>
          <p className="text-muted-foreground mt-1">Campanhas segmentadas e newsletter</p>
        </div>
        {activeTab === "campaigns" && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Campanha
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "campaigns" as const, label: "Campanhas", icon: Megaphone },
          { key: "newsletter" as const, label: "Newsletter", icon: Mail },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "newsletter" ? (
        <NewsletterTab />
      ) : (
        <>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Campanhas</p>
            <p className="text-xl font-extrabold text-foreground">{campaigns.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total enviados</p>
            <p className="text-xl font-extrabold text-foreground">{totalSent}</p>
          </div>
        </div>
        <div className="bg-card rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center">
            <Eye className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Taxa de abertura</p>
            <p className="text-xl font-extrabold text-foreground">
              {totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Create Campaign Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card rounded-3xl p-6 space-y-5">
              <h3 className="text-lg font-extrabold text-foreground">Criar Campanha</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Black Friday 2026"
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                  <div className="flex gap-2">
                    {[
                      { key: "notification", label: "Notificação", icon: Send },
                      { key: "coupon", label: "Cupom", icon: Percent },
                      { key: "both", label: "Ambos", icon: Megaphone },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setForm({ ...form, type: t.key as any })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold transition-all ${
                          form.type === t.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-primary/10"
                        }`}
                      >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Mensagem da campanha..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {(form.type === "coupon" || form.type === "both") && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo desconto</label>
                    <select
                      value={form.coupon_discount_type}
                      onChange={(e) => setForm({ ...form, coupon_discount_type: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">R$</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor</label>
                    <input type="number" value={form.coupon_discount_value} onChange={(e) => setForm({ ...form, coupon_discount_value: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pedido mín.</label>
                    <input type="number" value={form.coupon_min_order} onChange={(e) => setForm({ ...form, coupon_min_order: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Validade (dias)</label>
                    <input type="number" value={form.coupon_expires_days} onChange={(e) => setForm({ ...form, coupon_expires_days: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              )}

              {/* Segmentation */}
              <div>
                <p className="text-sm font-bold text-foreground mb-3">Segmentação</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
                    <select value={form.segment_status} onChange={(e) => setForm({ ...form, segment_status: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Todos</option>
                      <option value="lead">Lead</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tag</label>
                    <select value={form.segment_tag} onChange={(e) => setForm({ ...form, segment_tag: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Todas</option>
                      {allTags.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Gasto mín. (R$)</label>
                    <input type="number" value={form.segment_min_spent} onChange={(e) => setForm({ ...form, segment_min_spent: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={previewSegment}
                      className="w-full px-4 py-2.5 rounded-2xl bg-muted text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Preview {previewCount !== null && `(${previewCount})`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending || !form.name.trim() || !form.message.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Enviando..." : "Enviar Campanha"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-3xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-border" />
                <div className="h-3 w-24 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">
          Nenhuma campanha criada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp, i) => {
            const isExpanded = expandedId === camp.id;
            const st = statusConfig[camp.status] || statusConfig.draft;
            const StIcon = st.icon;
            const openRate = camp.total > 0 ? ((camp.opened / camp.total) * 100).toFixed(0) : "0";
            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-3xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : camp.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{camp.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${st.class}`}>
                        <StIcon className="w-3 h-3" />{st.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(camp.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{camp.total}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{openRate}%</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Destinatários</p>
                            <p className="text-lg font-bold text-foreground">{camp.total}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Abertos</p>
                            <p className="text-lg font-bold text-emerald-600">{camp.opened}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Taxa de abertura</p>
                            <p className="text-lg font-bold text-foreground">{openRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <p className="text-sm font-semibold text-foreground capitalize">{camp.type}</p>
                          </div>
                        </div>
                        {camp.message && (
                          <div className="bg-muted rounded-2xl p-3">
                            <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                            <p className="text-sm text-foreground">{camp.message}</p>
                          </div>
                        )}
                        {camp.coupon_discount_value && (
                          <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-primary" />
                            <span className="text-sm text-foreground">
                              {camp.coupon_discount_type === "percentage" ? `${camp.coupon_discount_value}%` : `R$${camp.coupon_discount_value}`} de desconto
                              {camp.coupon_min_order ? ` (mín. R$${camp.coupon_min_order})` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      </>
      )}
    </AdminLayout>
  );
}
