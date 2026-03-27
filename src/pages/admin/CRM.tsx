import { useEffect, useState, useMemo, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Tag, Download, CheckSquare, Bell, ArrowRightLeft, X, BarChart3, Target, UserCheck, Users } from "lucide-react";
import CRMFunnelCards from "@/components/admin/crm/CRMFunnelCards";
import CRMClientList, { type EnrichedClient } from "@/components/admin/crm/CRMClientList";
import CRMClientDrawer from "@/components/admin/crm/CRMClientDrawer";
import CRMScoringTab from "@/components/admin/crm/CRMScoringTab";
import CRMFollowUpTab from "@/components/admin/crm/CRMFollowUpTab";
import CRMAnalyticsTab from "@/components/admin/crm/CRMAnalyticsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminCRM() {
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [showNewTag, setShowNewTag] = useState(false);

  // Raw data for sub-tabs
  const [rawOrders, setRawOrders] = useState<{ user_id: string; total: number; created_at: string }[]>([]);
  const [rawPets, setRawPets] = useState<{ user_id: string; name: string; birth_date: string | null }[]>([]);
  const [rawPoints, setRawPoints] = useState<{ user_id: string; points: number }[]>([]);
  const [rawReviews, setRawReviews] = useState<{ user_id: string; created_at: string }[]>([]);

  // Bulk actions
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"tag" | "status" | "notify" | null>(null);
  const [bulkTagId, setBulkTagId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkNotifTitle, setBulkNotifTitle] = useState("");
  const [bulkNotifMessage, setBulkNotifMessage] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, ordersRes, pointsRes, statusRes, tagsRes, assignmentsRes, newsletterRes, petsRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total, created_at"),
        supabase.from("loyalty_points").select("user_id, points"),
        supabase.from("customer_status").select("user_id, status"),
        supabase.from("customer_tags").select("*").order("name"),
        supabase.from("customer_tag_assignments").select("user_id, tag_id"),
        supabase.from("newsletter_subscribers" as any).select("*").is("user_id", null).eq("status", "active"),
        supabase.from("pets").select("user_id, name, birth_date"),
        supabase.from("product_reviews").select("user_id, created_at"),
      ]);

      if (profilesRes.error || ordersRes.error || pointsRes.error || statusRes.error || tagsRes.error || assignmentsRes.error) {
        toast.error("Erro ao carregar dados de clientes");
      }

      const profiles = profilesRes.data || [];
      const orders = ordersRes.data || [];
      const points = pointsRes.data || [];
      const statuses = statusRes.data || [];
      const tags = (tagsRes.data || []) as { id: string; name: string; color: string }[];
      const assignments = assignmentsRes.data || [];
      const nlLeads = (newsletterRes.data || []) as any[];

      setAllTags(tags);
      setRawOrders(orders as any);
      setRawPets((petsRes.data || []) as any);
      setRawPoints(points as any);
      setRawReviews((reviewsRes.data || []) as any);

      const enriched: EnrichedClient[] = profiles.map((p: any) => {
        const userOrders = orders.filter((o: any) => o.user_id === p.user_id);
        const userPoints = points.filter((pt: any) => pt.user_id === p.user_id);
        const userStatus = statuses.find((s: any) => s.user_id === p.user_id);
        const userTagIds = assignments.filter((a: any) => a.user_id === p.user_id).map((a: any) => a.tag_id);
        const userTags = tags.filter((t) => userTagIds.includes(t.id));
        const sorted = [...userOrders].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        let status = userStatus?.status || "lead";
        if (!userStatus && userOrders.length > 0) status = "active";

        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          phone: p.phone,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
          totalPoints: userPoints.reduce((s: number, pt: any) => s + pt.points, 0),
          lastOrderDate: sorted[0]?.created_at || null,
          status,
          tags: userTags,
        };
      });

      const nlClients: EnrichedClient[] = nlLeads.map((nl: any) => ({
        id: nl.id,
        user_id: "",
        full_name: nl.name || nl.email,
        phone: null,
        avatar_url: null,
        created_at: nl.subscribed_at,
        orderCount: 0,
        totalSpent: 0,
        totalPoints: 0,
        lastOrderDate: null,
        status: "newsletter_lead",
        tags: [],
      }));

      setClients([...enriched, ...nlClients]);
    } catch {
      toast.error("Erro ao carregar dados de clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const funnelData = useMemo(() => {
    const data = { lead: 0, active: 0, inactive: 0, vip: 0, newsletter_lead: 0 };
    clients.forEach((c) => {
      if (c.status in data) data[c.status as keyof typeof data]++;
    });
    return data;
  }, [clients]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (tagFilter && !c.tags.some((t) => t.id === tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (c.full_name || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
      }
      return true;
    });
  }, [clients, statusFilter, tagFilter, search]);

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    await supabase.from("customer_tags").insert({ name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    setShowNewTag(false);
    fetchData();
  }

  function handleRefresh() {
    fetchData().then(() => {
      if (selectedClient) {
        setSelectedClient((prev) => {
          if (!prev) return null;
          const updated = clients.find((c) => c.id === prev.id);
          return updated || prev;
        });
      }
    });
  }

  function handleExportCSV() {
    const headers = ["Nome", "Telefone", "Status", "Pedidos", "Gasto Total (R$)", "Pontos", "Tags", "Último Pedido", "Cadastro"];
    const rows = filtered.map((c) => [
      c.full_name || "Sem nome", c.phone || "", c.status, c.orderCount,
      c.totalSpent.toFixed(2), c.totalPoints,
      c.tags.map((t) => t.name).join("; "),
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("pt-BR") : "",
      new Date(c.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients]);

  function handleToggleSelect(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleSelectAll() {
    const filteredUserIds = filtered.filter(c => c.user_id).map(c => c.user_id);
    const allSelected = filteredUserIds.every(id => selectedIds.has(id));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredUserIds));
  }

  async function executeBulkAction() {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      if (bulkAction === "tag" && bulkTagId) {
        for (const uid of ids) {
          await supabase.from("customer_tag_assignments").upsert({ user_id: uid, tag_id: bulkTagId }, { onConflict: "user_id,tag_id" });
        }
        toast.success(`Tag aplicada a ${ids.length} clientes`);
      } else if (bulkAction === "status" && bulkStatus) {
        for (const uid of ids) {
          await supabase.from("customer_status").upsert({ user_id: uid, status: bulkStatus, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        }
        toast.success(`Status atualizado para ${ids.length} clientes`);
      } else if (bulkAction === "notify" && bulkNotifTitle.trim()) {
        for (const uid of ids) {
          await supabase.from("user_notifications").insert({ user_id: uid, title: bulkNotifTitle.trim(), message: bulkNotifMessage.trim() || null, type: "info" });
        }
        toast.success(`Notificação enviada para ${ids.length} clientes`);
      }
    } catch {
      toast.error("Erro ao executar ação em massa");
    }
    setBulkProcessing(false);
    setBulkAction(null);
    setBulkTagId("");
    setBulkStatus("");
    setBulkNotifTitle("");
    setBulkNotifMessage("");
    setSelectedIds(new Set());
    setBulkMode(false);
    fetchData();
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Clientes</h1>
        <p className="text-muted-foreground mt-1">Gestão avançada de clientes, scoring e follow-up inteligente</p>
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="bg-card border border-border/50 p-1 rounded-2xl h-auto flex-wrap">
          <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2.5">
            <Users className="w-4 h-4" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="scoring" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2.5">
            <Target className="w-4 h-4" /> Scoring
          </TabsTrigger>
          <TabsTrigger value="followup" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2.5">
            <UserCheck className="w-4 h-4" /> Follow-up
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2.5">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ============ CLIENTS TAB ============ */}
        <TabsContent value="clients" className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); setBulkAction(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                bulkMode ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground hover:border-primary/30"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {bulkMode ? "Sair seleção" : "Ações em massa"}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground hover:border-primary/30 hover:shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>

          {/* Bulk action bar */}
          {bulkMode && selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-foreground">{selectedIds.size} selecionado{selectedIds.size > 1 ? "s" : ""}</span>
              <div className="flex gap-2 flex-wrap flex-1">
                <button onClick={() => setBulkAction(bulkAction === "tag" ? null : "tag")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${bulkAction === "tag" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground hover:border-primary/30"}`}>
                  <Tag className="w-3.5 h-3.5" /> Aplicar tag
                </button>
                <button onClick={() => setBulkAction(bulkAction === "status" ? null : "status")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${bulkAction === "status" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground hover:border-primary/30"}`}>
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Mudar status
                </button>
                <button onClick={() => setBulkAction(bulkAction === "notify" ? null : "notify")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${bulkAction === "notify" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground hover:border-primary/30"}`}>
                  <Bell className="w-3.5 h-3.5" /> Notificar
                </button>
              </div>
              <button onClick={() => { setSelectedIds(new Set()); setBulkAction(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>

              {bulkAction === "tag" && (
                <div className="w-full flex items-center gap-2 mt-2">
                  <select value={bulkTagId} onChange={(e) => setBulkTagId(e.target.value)} className="px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Selecionar tag...</option>
                    {allTags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={executeBulkAction} disabled={!bulkTagId || bulkProcessing} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                    {bulkProcessing ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              )}
              {bulkAction === "status" && (
                <div className="w-full flex items-center gap-2 mt-2">
                  {["lead", "active", "inactive", "vip"].map((s) => (
                    <button key={s} onClick={() => setBulkStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${bulkStatus === s ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground"}`}>
                      {s === "lead" ? "Lead" : s === "active" ? "Ativo" : s === "inactive" ? "Inativo" : "VIP"}
                    </button>
                  ))}
                  <button onClick={executeBulkAction} disabled={!bulkStatus || bulkProcessing} className="ml-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                    {bulkProcessing ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              )}
              {bulkAction === "notify" && (
                <div className="w-full space-y-2 mt-2">
                  <input value={bulkNotifTitle} onChange={(e) => setBulkNotifTitle(e.target.value)} placeholder="Título da notificação" className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={bulkNotifMessage} onChange={(e) => setBulkNotifMessage(e.target.value)} placeholder="Mensagem (opcional)" className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={executeBulkAction} disabled={!bulkNotifTitle.trim() || bulkProcessing} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                    {bulkProcessing ? "Enviando..." : "Enviar para todos"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total de clientes</p>
              <p className="text-2xl font-extrabold text-foreground">{clients.length}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Com compras</p>
              <p className="text-2xl font-extrabold text-foreground">{clients.filter(c => c.orderCount > 0).length}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Gasto médio</p>
              <p className="text-2xl font-extrabold text-foreground">
                {clients.length > 0 ? `R$ ${(clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length).toFixed(2)}` : "R$ 0,00"}
              </p>
            </div>
          </div>

          <CRMFunnelCards data={funnelData} selected={statusFilter} onSelect={setStatusFilter} />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tagFilter === tag.id ? "ring-2 ring-primary shadow-sm" : "opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: tag.color + "22", color: tag.color }}
                >
                  {tag.name}
                </button>
              ))}
              {!showNewTag ? (
                <button onClick={() => setShowNewTag(true)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-card text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="w-3 h-3 inline mr-1" />Nova tag
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateTag()} placeholder="Nome da tag" className="px-3 py-1.5 rounded-full text-xs bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-28" autoFocus />
                  <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-6 h-6 rounded-full border-0 cursor-pointer" />
                  <button onClick={handleCreateTag} className="text-xs font-semibold text-primary">Criar</button>
                  <button onClick={() => setShowNewTag(false)} className="text-xs text-muted-foreground">✕</button>
                </div>
              )}
            </div>
          </div>

          <CRMClientList
            clients={filtered}
            loading={loading}
            onSelect={setSelectedClient}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />
        </TabsContent>

        {/* ============ SCORING TAB ============ */}
        <TabsContent value="scoring">
          <CRMScoringTab clients={clients} orders={rawOrders} pets={rawPets} loyaltyPoints={rawPoints} />
        </TabsContent>

        {/* ============ FOLLOW-UP TAB ============ */}
        <TabsContent value="followup">
          <CRMFollowUpTab clients={clients} orders={rawOrders} pets={rawPets} reviews={rawReviews} />
        </TabsContent>

        {/* ============ ANALYTICS TAB ============ */}
        <TabsContent value="analytics">
          <CRMAnalyticsTab clients={clients} orders={rawOrders} />
        </TabsContent>
      </Tabs>

      {selectedClient && (
        <CRMClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} allTags={allTags} onRefresh={handleRefresh} />
      )}
    </AdminLayout>
  );
}
