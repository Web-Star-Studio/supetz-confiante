import { useEffect, useState, useMemo, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Tag, Download } from "lucide-react";
import CRMFunnelCards from "@/components/admin/crm/CRMFunnelCards";
import CRMClientList, { type EnrichedClient } from "@/components/admin/crm/CRMClientList";
import CRMClientDrawer from "@/components/admin/crm/CRMClientDrawer";
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, ordersRes, pointsRes, statusRes, tagsRes, assignmentsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("user_id, total, created_at"),
      supabase.from("loyalty_points").select("user_id, points"),
      supabase.from("customer_status").select("user_id, status"),
      supabase.from("customer_tags").select("*").order("name"),
      supabase.from("customer_tag_assignments").select("user_id, tag_id"),
    ]);

    const profiles = profilesRes.data || [];
    const orders = ordersRes.data || [];
    const points = pointsRes.data || [];
    const statuses = statusRes.data || [];
    const tags = (tagsRes.data || []) as { id: string; name: string; color: string }[];
    const assignments = assignmentsRes.data || [];

    setAllTags(tags);

    const enriched: EnrichedClient[] = profiles.map((p: any) => {
      const userOrders = orders.filter((o: any) => o.user_id === p.user_id);
      const userPoints = points.filter((pt: any) => pt.user_id === p.user_id);
      const userStatus = statuses.find((s: any) => s.user_id === p.user_id);
      const userTagIds = assignments.filter((a: any) => a.user_id === p.user_id).map((a: any) => a.tag_id);
      const userTags = tags.filter((t) => userTagIds.includes(t.id));
      const sorted = [...userOrders].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Auto-determine status if not set
      let status = userStatus?.status || "lead";
      if (!userStatus) {
        if (userOrders.length > 0) status = "active";
      }

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

    setClients(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const funnelData = useMemo(() => {
    const data = { lead: 0, active: 0, inactive: 0, vip: 0 };
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
        // Re-select with updated data
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
      c.full_name || "Sem nome",
      c.phone || "",
      c.status,
      c.orderCount,
      c.totalSpent.toFixed(2),
      c.totalPoints,
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

  // Update selectedClient when clients change
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients]);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestão avançada de clientes e funil de vendas</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground hover:border-primary/30 hover:shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
            {clients.length > 0
              ? `R$ ${(clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length).toFixed(2)}`
              : "R$ 0,00"}
          </p>
        </div>
      </div>

      <CRMFunnelCards data={funnelData} selected={statusFilter} onSelect={setStatusFilter} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>

        {/* Tag filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                tagFilter === tag.id ? "ring-2 ring-primary shadow-sm" : "opacity-60 hover:opacity-100"
              }`}
              style={{ backgroundColor: tag.color + "22", color: tag.color }}
            >
              {tag.name}
            </button>
          ))}
          {!showNewTag ? (
            <button onClick={() => setShowNewTag(true)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-supet-bg-alt text-muted-foreground hover:text-primary transition-colors">
              <Plus className="w-3 h-3 inline mr-1" />Nova tag
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                placeholder="Nome da tag"
                className="px-3 py-1.5 rounded-full text-xs bg-supet-bg-alt text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-28"
                autoFocus
              />
              <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-6 h-6 rounded-full border-0 cursor-pointer" />
              <button onClick={handleCreateTag} className="text-xs font-semibold text-primary">Criar</button>
              <button onClick={() => setShowNewTag(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
          )}
        </div>
      </div>

      <CRMClientList clients={filtered} loading={loading} onSelect={setSelectedClient} />

      {selectedClient && (
        <CRMClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} allTags={allTags} onRefresh={handleRefresh} />
      )}
    </AdminLayout>
  );
}
