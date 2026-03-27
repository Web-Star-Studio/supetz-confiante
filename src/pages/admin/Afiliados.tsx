import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  Handshake, Users, DollarSign, TrendingUp, CheckCircle, XCircle,
  Clock, Eye, Loader2, Search, Wallet, Plus, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, BarChart3, Award, Download, MousePointerClick,
  Target, Percent, Crown, Medal, Trophy, Zap, AlertTriangle,
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const AFF_PAGE_SIZE = 10;

type AffSortCol = "created_at" | "total_earned" | "commission_percent" | "status" | "name";
type AffSortDir = "asc" | "desc";

interface Affiliate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  instagram: string | null;
  channel_type: string;
  status: string;
  commission_percent: number;
  coupon_code: string | null;
  ref_slug: string | null;
  total_earned: number;
  created_at: string;
  approved_at: string | null;
  pix_key: string | null;
}

interface Sale {
  id: string;
  affiliate_id: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  pix_key: string | null;
  created_at: string;
  paid_at: string | null;
}

interface Click {
  id: string;
  affiliate_id: string;
  created_at: string;
}

export default function Afiliados() {
  const { log } = useAuditLog();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<Affiliate[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [editCommission, setEditCommission] = useState<number>(10);
  const [editFields, setEditFields] = useState({ name: "", email: "", instagram: "", pix_key: "", channel_type: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", instagram: "", channel_type: "influencer",
    commission_percent: 10, pix_key: "", autoApprove: false,
  });
  const [affPage, setAffPage] = useState(0);
  const [affTotalCount, setAffTotalCount] = useState(0);
  const [affSortCol, setAffSortCol] = useState<AffSortCol>("created_at");
  const [affSortDir, setAffSortDir] = useState<AffSortDir>("desc");
  const [mainTab, setMainTab] = useState("gestao");

  const toggleAffSort = (col: AffSortCol) => {
    if (affSortCol === col) setAffSortDir(d => d === "asc" ? "desc" : "asc");
    else { setAffSortCol(col); setAffSortDir("desc"); }
    setAffPage(0);
  };

  useEffect(() => {
    loadData();
  }, [affPage, statusFilter, search, affSortCol, affSortDir]);

  useEffect(() => { setAffPage(0); }, [statusFilter, search]);

  const loadData = async () => {
    setLoading(true);
    const from = affPage * AFF_PAGE_SIZE;
    const to = from + AFF_PAGE_SIZE - 1;

    let affQuery = supabase.from("affiliates").select("*", { count: "exact" }).order(affSortCol, { ascending: affSortDir === "asc" }).range(from, to);
    if (statusFilter !== "all") affQuery = affQuery.eq("status", statusFilter);
    if (search.trim()) affQuery = affQuery.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);

    const [affRes, allAffRes, salesRes, payoutsRes, clicksRes] = await Promise.all([
      affQuery,
      supabase.from("affiliates").select("*"),
      supabase.from("affiliate_sales").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_clicks").select("id, affiliate_id, created_at").order("created_at", { ascending: false }),
    ]);
    setAffiliates((affRes.data as Affiliate[]) || []);
    setAllAffiliates((allAffRes.data as Affiliate[]) || []);
    setAffTotalCount(affRes.count || 0);
    setSales((salesRes.data as Sale[]) || []);
    setPayouts((payoutsRes.data as Payout[]) || []);
    setClicks((clicksRes.data as Click[]) || []);
    setLoading(false);
  };

  const affTotalPages = Math.ceil(affTotalCount / AFF_PAGE_SIZE);

  // ─── Analytics computations ───
  const analytics = useMemo(() => {
    const now = new Date();
    const last30 = subDays(now, 30);
    const last60 = subDays(now, 60);

    // Sales trend (last 30 days)
    const salesByDay: Record<string, { revenue: number; commission: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(now, i), "dd/MM");
      salesByDay[d] = { revenue: 0, commission: 0 };
    }
    sales.forEach(s => {
      const d = new Date(s.created_at);
      if (d >= last30) {
        const key = format(d, "dd/MM");
        if (salesByDay[key]) {
          salesByDay[key].revenue += s.order_total;
          salesByDay[key].commission += s.commission_amount;
        }
      }
    });
    const salesTrend = Object.entries(salesByDay).map(([day, v]) => ({ day, ...v }));

    // Clicks trend (last 30 days)
    const clicksByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      clicksByDay[format(subDays(now, i), "dd/MM")] = 0;
    }
    clicks.forEach(c => {
      const d = new Date(c.created_at);
      if (d >= last30) {
        const key = format(d, "dd/MM");
        if (clicksByDay[key] !== undefined) clicksByDay[key]++;
      }
    });
    const clicksTrend = Object.entries(clicksByDay).map(([day, clicks]) => ({ day, clicks }));

    // Channel distribution
    const channelMap: Record<string, number> = {};
    allAffiliates.forEach(a => {
      channelMap[a.channel_type] = (channelMap[a.channel_type] || 0) + 1;
    });
    const channelDist = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

    // Top performers ranking
    const ranking = allAffiliates
      .filter(a => a.status === "active")
      .map(a => {
        const affSales = sales.filter(s => s.affiliate_id === a.id);
        const affClicks = clicks.filter(c => c.affiliate_id === a.id);
        const totalRevenue = affSales.reduce((sum, s) => sum + s.order_total, 0);
        const totalCommission = affSales.reduce((sum, s) => sum + s.commission_amount, 0);
        const conversionRate = affClicks.length > 0 ? (affSales.length / affClicks.length * 100) : 0;
        const avgTicket = affSales.length > 0 ? totalRevenue / affSales.length : 0;
        const recentSales = affSales.filter(s => new Date(s.created_at) >= last30);
        const prevSales = affSales.filter(s => { const d = new Date(s.created_at); return d >= last60 && d < last30; });
        const recentRevenue = recentSales.reduce((sum, s) => sum + s.order_total, 0);
        const prevRevenue = prevSales.reduce((sum, s) => sum + s.order_total, 0);
        const growth = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue * 100) : (recentRevenue > 0 ? 100 : 0);
        const daysSinceJoin = differenceInDays(now, new Date(a.created_at));

        return {
          ...a,
          totalSales: affSales.length,
          totalRevenue,
          totalCommission,
          totalClicks: affClicks.length,
          conversionRate,
          avgTicket,
          growth,
          recentSalesCount: recentSales.length,
          daysSinceJoin,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Global metrics
    const totalClicksCount = clicks.length;
    const totalSalesCount = sales.length;
    const globalConversion = totalClicksCount > 0 ? (totalSalesCount / totalClicksCount * 100) : 0;
    const avgCommissionRate = allAffiliates.length > 0 ? allAffiliates.reduce((s, a) => s + a.commission_percent, 0) / allAffiliates.length : 0;
    const totalRevenueAll = sales.reduce((s, sale) => s + sale.order_total, 0);
    const totalCommissionsAll = sales.reduce((s, sale) => s + sale.commission_amount, 0);
    const roi = totalCommissionsAll > 0 ? ((totalRevenueAll - totalCommissionsAll) / totalCommissionsAll * 100) : 0;

    // Inactive affiliates (active but no sales in 30 days)
    const inactive = allAffiliates.filter(a => {
      if (a.status !== "active") return false;
      const affSales = sales.filter(s => s.affiliate_id === a.id);
      if (affSales.length === 0) return differenceInDays(now, new Date(a.created_at)) > 14;
      const lastSale = new Date(Math.max(...affSales.map(s => new Date(s.created_at).getTime())));
      return differenceInDays(now, lastSale) > 30;
    });

    return { salesTrend, clicksTrend, channelDist, ranking, totalClicksCount, globalConversion, avgCommissionRate, roi, inactive, totalRevenueAll, totalCommissionsAll };
  }, [allAffiliates, sales, clicks]);

  const handleApprove = async (aff: Affiliate) => {
    const couponCode = `SUPET-${aff.name.split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const refSlug = aff.ref_slug || aff.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(2, 5);

    const { error } = await supabase
      .from("affiliates")
      .update({ status: "active", approved_at: new Date().toISOString(), coupon_code: couponCode, ref_slug: refSlug })
      .eq("id", aff.id);

    if (error) { toast.error("Erro ao aprovar afiliado"); return; }

    const affiliateLink = `${window.location.origin}/?ref=${refSlug}`;
    await supabase.from("user_notifications").insert({
      user_id: aff.user_id,
      title: "🎉 Você foi aprovado como parceiro Supet!",
      message: `Parabéns, ${aff.name}! Seu cupom exclusivo é ${couponCode} (${aff.commission_percent}% de comissão). Compartilhe seu link: ${affiliateLink}`,
      type: "affiliate",
      link: "/parceiros/dashboard",
    });

    await supabase.functions.invoke("notify-affiliate-approved", {
      body: { affiliateId: aff.id, name: aff.name, email: aff.email, couponCode, refSlug, commissionPercent: aff.commission_percent, affiliateLink },
    });

    toast.success(`${aff.name} aprovado! Cupom: ${couponCode}`);
    log({ action: "create", entity_type: "affiliate", entity_id: aff.id, details: { name: aff.name, coupon: couponCode, refSlug } });
    loadData();
  };

  const handleBulkApprove = async () => {
    const pending = allAffiliates.filter(a => a.status === "pending");
    if (pending.length === 0) { toast.info("Nenhum afiliado pendente."); return; }
    if (!window.confirm(`Aprovar ${pending.length} afiliado(s) pendente(s)?`)) return;
    for (const aff of pending) { await handleApprove(aff); }
  };

  const handleSuspend = async (aff: Affiliate) => {
    const { error } = await supabase.from("affiliates").update({ status: "suspended" }).eq("id", aff.id);
    if (!error) { toast.success(`${aff.name} suspenso.`); log({ action: "update", entity_type: "affiliate", entity_id: aff.id, details: { action: "suspend" } }); loadData(); }
    else toast.error("Erro ao suspender");
  };

  const handleReactivate = async (aff: Affiliate) => {
    const { error } = await supabase.from("affiliates").update({ status: "active" }).eq("id", aff.id);
    if (!error) { toast.success(`${aff.name} reativado.`); loadData(); }
    else toast.error("Erro ao reativar");
  };

  const handleDelete = async (aff: Affiliate) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente "${aff.name}"?`)) return;
    await Promise.all([
      supabase.from("affiliate_sales").delete().eq("affiliate_id", aff.id),
      supabase.from("affiliate_clicks").delete().eq("affiliate_id", aff.id),
      supabase.from("affiliate_payouts").delete().eq("affiliate_id", aff.id),
    ]);
    const { error } = await supabase.from("affiliates").delete().eq("id", aff.id);
    if (!error) { toast.success(`${aff.name} excluído.`); log({ action: "delete", entity_type: "affiliate", entity_id: aff.id, details: { name: aff.name } }); loadData(); }
    else toast.error("Erro ao excluir: " + error.message);
  };

  const handleUpdateCommission = async () => {
    if (!selectedAffiliate) return;
    const { error } = await supabase.from("affiliates").update({ commission_percent: editCommission }).eq("id", selectedAffiliate.id);
    if (!error) { toast.success("Comissão atualizada!"); log({ action: "update", entity_type: "affiliate", entity_id: selectedAffiliate.id, details: { new_percent: editCommission } }); setSelectedAffiliate(null); loadData(); }
    else toast.error("Erro ao atualizar comissão");
  };

  const handleSaveEditFields = async () => {
    if (!selectedAffiliate) return;
    const { error } = await supabase.from("affiliates").update({
      name: editFields.name, email: editFields.email, instagram: editFields.instagram || null, pix_key: editFields.pix_key || null, channel_type: editFields.channel_type,
    }).eq("id", selectedAffiliate.id);
    if (!error) { toast.success("Dados atualizados!"); log({ action: "update", entity_type: "affiliate", entity_id: selectedAffiliate.id, details: { edited: editFields } }); setSelectedAffiliate(null); loadData(); }
    else toast.error("Erro ao salvar alterações");
  };

  const openAffiliateDetail = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setEditCommission(aff.commission_percent);
    setEditFields({ name: aff.name, email: aff.email, instagram: aff.instagram || "", pix_key: aff.pix_key || "", channel_type: aff.channel_type });
  };

  const handleMarkPayoutPaid = async (payout: Payout) => {
    const { error } = await supabase.from("affiliate_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payout.id);
    if (!error) { toast.success("Saque marcado como pago!"); log({ action: "update", entity_type: "affiliate_payout", entity_id: payout.id, details: { amount: payout.amount } }); loadData(); }
    else toast.error("Erro ao marcar como pago");
  };

  const handleConfirmSale = async (sale: Sale) => {
    const { error } = await supabase.from("affiliate_sales").update({ status: "confirmed" }).eq("id", sale.id);
    if (!error) { toast.success("Venda confirmada!"); loadData(); }
  };

  const handleAddAffiliate = async () => {
    if (!addForm.name || !addForm.email) { toast.error("Nome e email são obrigatórios"); return; }
    const refSlug = addForm.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(2, 5);
    const couponCode = addForm.autoApprove ? `SUPET-${addForm.name.split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : null;

    let userId = "00000000-0000-0000-0000-000000000000";
    const { data: foundUserId } = await supabase.rpc("find_user_id_by_email", { lookup_email: addForm.email });
    if (foundUserId) userId = foundUserId;

    const { error } = await supabase.from("affiliates").insert({
      name: addForm.name, email: addForm.email, instagram: addForm.instagram || null, channel_type: addForm.channel_type,
      commission_percent: addForm.commission_percent, pix_key: addForm.pix_key || null, ref_slug: refSlug, coupon_code: couponCode,
      status: addForm.autoApprove ? "active" : "pending", approved_at: addForm.autoApprove ? new Date().toISOString() : null, user_id: userId,
    });
    if (!error) {
      toast.success(`${addForm.name} adicionado!`);
      log({ action: "create", entity_type: "affiliate", entity_id: "new", details: { name: addForm.name } });
      setShowAddDialog(false);
      setAddForm({ name: "", email: "", instagram: "", channel_type: "influencer", commission_percent: 10, pix_key: "", autoApprove: false });
      loadData();
    } else toast.error("Erro: " + error.message);
  };

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Canal", "Status", "Comissão%", "TotalGanho", "Cupom", "RefSlug", "CriadoEm"];
    const rows = allAffiliates.map(a => [a.name, a.email, a.channel_type, a.status, a.commission_percent, a.total_earned.toFixed(2), a.coupon_code || "", a.ref_slug || "", format(new Date(a.created_at), "dd/MM/yyyy")]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `afiliados-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const filtered = affiliates;
  const activeCount = allAffiliates.filter(a => a.status === "active").length;
  const pendingCount = allAffiliates.filter(a => a.status === "pending").length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.order_total, 0);
  const totalCommissions = sales.reduce((sum, s) => sum + s.commission_amount, 0);
  const pendingPayouts = payouts.filter(p => p.status === "pending");

  const channelLabels: Record<string, string> = { influencer: "Influenciador", partner: "Parceiro", creator: "Creator", vet: "Veterinário" };
  const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];
  const TIER_ICONS = [Crown, Trophy, Medal, Award];

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Handshake className="w-6 h-6 text-primary" /> Programa de Afiliados
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie parceiros, influenciadores e comissões.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted/80 transition">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <button onClick={() => setShowAddDialog(true)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Ativos", value: activeCount, icon: Users, color: "text-green-500" },
            { label: "Pendentes", value: pendingCount, icon: Clock, color: "text-yellow-500" },
            { label: "Receita Gerada", value: `R$ ${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-blue-500" },
            { label: "Comissões Totais", value: `R$ ${totalCommissions.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
            { label: "Conversão", value: `${analytics.globalConversion.toFixed(1)}%`, icon: Target, color: "text-emerald-500" },
            { label: "ROI", value: `${analytics.roi.toFixed(0)}%`, icon: Percent, color: "text-violet-500" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <kpi.icon className={`w-5 h-5 ${kpi.color} mb-1`} />
              <p className="text-xl font-black text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="gestao" className="gap-1"><Users className="w-3.5 h-3.5" /> Gestão</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1"><Award className="w-3.5 h-3.5" /> Ranking</TabsTrigger>
            <TabsTrigger value="saques" className="gap-1"><Wallet className="w-3.5 h-3.5" /> Saques</TabsTrigger>
          </TabsList>

          {/* ── GESTÃO TAB ── */}
          <TabsContent value="gestao" className="space-y-4">
            {/* Pending payouts alert */}
            {pendingPayouts.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-orange-500" /> {pendingPayouts.length} saque(s) pendente(s)
                </h3>
                <p className="text-xs text-muted-foreground">Vá para a aba Saques para gerenciar.</p>
              </div>
            )}

            {/* Bulk approve */}
            {pendingCount > 0 && (
              <div className="flex justify-end">
                <button onClick={handleBulkApprove} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition">
                  <Zap className="w-4 h-4" /> Aprovar todos pendentes ({pendingCount})
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Buscar por nome ou email..." />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="active">Ativos</option>
                <option value="suspended">Suspensos</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleAffSort("name")}>
                        <span className="inline-flex items-center gap-1">Nome {affSortCol === "name" ? (affSortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">Canal</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">Cupom</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleAffSort("commission_percent")}>
                        <span className="inline-flex items-center gap-1">Comissão {affSortCol === "commission_percent" ? (affSortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleAffSort("total_earned")}>
                        <span className="inline-flex items-center gap-1">Ganho {affSortCol === "total_earned" ? (affSortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleAffSort("status")}>
                        <span className="inline-flex items-center gap-1">Status {affSortCol === "status" ? (affSortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-bold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(aff => {
                      const affSales = sales.filter(s => s.affiliate_id === aff.id);
                      const affClicks = clicks.filter(c => c.affiliate_id === aff.id);
                      return (
                        <tr key={aff.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{aff.name}</p>
                            <p className="text-xs text-muted-foreground">{aff.email}</p>
                            {aff.instagram && <p className="text-xs text-primary">@{aff.instagram.replace("@", "")}</p>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{channelLabels[aff.channel_type] || aff.channel_type}</td>
                          <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-foreground">{aff.coupon_code || "—"}</td>
                          <td className="px-4 py-3 text-foreground font-bold">{aff.commission_percent}%</td>
                          <td className="px-4 py-3 text-foreground">
                            R$ {aff.total_earned.toFixed(2).replace(".", ",")}
                            <span className="text-xs text-muted-foreground block">{affSales.length} vendas · {affClicks.length} cliques</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${aff.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : aff.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                              {aff.status === "active" ? "Ativo" : aff.status === "pending" ? "Pendente" : "Suspenso"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {aff.status === "pending" && <button onClick={() => handleApprove(aff)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg" title="Aprovar"><CheckCircle className="w-4 h-4" /></button>}
                              {aff.status === "active" && <button onClick={() => handleSuspend(aff)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg" title="Suspender"><XCircle className="w-4 h-4" /></button>}
                              {aff.status === "suspended" && <button onClick={() => handleReactivate(aff)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg" title="Reativar"><CheckCircle className="w-4 h-4" /></button>}
                              <button onClick={() => openAffiliateDetail(aff)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg" title="Editar"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(aff)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nenhum afiliado encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {affTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setAffPage(p => Math.max(0, p - 1))} disabled={affPage === 0} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-sm text-muted-foreground">{affPage + 1} de {affTotalPages}</span>
                <button onClick={() => setAffPage(p => Math.min(affTotalPages - 1, p + 1))} disabled={affPage >= affTotalPages - 1} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </TabsContent>

          {/* ── ANALYTICS TAB ── */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales trend */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Receita e Comissões (30 dias)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                      <Area type="monotone" dataKey="commission" name="Comissão" stroke="#10b981" fill="rgba(16,185,129,0.2)" />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Clicks trend */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-blue-500" /> Cliques nos Links (30 dias)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.clicksTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Channel distribution */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" /> Distribuição por Canal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.channelDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${channelLabels[name] || name} (${value})`}>
                        {analytics.channelDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inactive affiliates */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Afiliados Inativos ({analytics.inactive.length})</h3>
                {analytics.inactive.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Todos os afiliados ativos estão vendendo! 🎉</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {analytics.inactive.map(a => {
                      const lastSale = sales.filter(s => s.affiliate_id === a.id).sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())[0];
                      return (
                        <div key={a.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                          <div>
                            <p className="text-sm font-bold text-foreground">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{lastSale ? `Última venda: ${format(new Date(lastSale.created_at), "dd/MM/yyyy")}` : "Sem vendas"}</p>
                          </div>
                          <button onClick={() => openAffiliateDetail(a)} className="text-xs font-bold text-primary hover:underline">Ver</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── RANKING TAB ── */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground">#</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground">Afiliado</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground">Receita Gerada</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">Vendas</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">Cliques</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground">Conversão</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">Ticket Médio</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">Crescimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.ranking.map((r, i) => {
                      const TierIcon = TIER_ICONS[Math.min(i, 3)];
                      const tierColors = ["text-yellow-500", "text-gray-400", "text-amber-600", "text-muted-foreground"];
                      return (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3"><TierIcon className={`w-5 h-5 ${tierColors[Math.min(i, 3)]}`} /></td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.commission_percent}% · {channelLabels[r.channel_type] || r.channel_type}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">R$ {r.totalRevenue.toFixed(2).replace(".", ",")}</td>
                          <td className="px-4 py-3 text-foreground hidden md:table-cell">{r.totalSales}</td>
                          <td className="px-4 py-3 text-foreground hidden md:table-cell">{r.totalClicks}</td>
                          <td className="px-4 py-3 font-bold text-foreground">{r.conversionRate.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-foreground hidden lg:table-cell">R$ {r.avgTicket.toFixed(2).replace(".", ",")}</td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.growth > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : r.growth < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                              {r.growth > 0 ? "+" : ""}{r.growth.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {analytics.ranking.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Nenhum afiliado ativo.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ── SAQUES TAB ── */}
          <TabsContent value="saques" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Total Pago</p>
                <p className="text-xl font-black text-green-600">R$ {payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Pendente de Pagamento</p>
                <p className="text-xl font-black text-yellow-600">R$ {pendingPayouts.reduce((s, p) => s + p.amount, 0).toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Total de Saques</p>
                <p className="text-xl font-black text-foreground">{payouts.length}</p>
              </div>
            </div>

            {pendingPayouts.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-orange-500" /> Saques Pendentes
                </h3>
                <div className="space-y-2">
                  {pendingPayouts.map(p => {
                    const aff = allAffiliates.find(a => a.id === p.affiliate_id);
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                        <div>
                          <p className="text-sm font-bold text-foreground">{aff?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">R$ {p.amount.toFixed(2).replace(".", ",")} · Pix: {p.pix_key || "não informado"} · {format(new Date(p.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <button onClick={() => handleMarkPayoutPaid(p)} className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600">Marcar como Pago</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {payouts.filter(p => p.status === "paid").length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3">Histórico de Pagamentos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-bold text-muted-foreground">Afiliado</th>
                        <th className="pb-2 font-bold text-muted-foreground">Valor</th>
                        <th className="pb-2 font-bold text-muted-foreground">Pix</th>
                        <th className="pb-2 font-bold text-muted-foreground">Pago em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.filter(p => p.status === "paid").map(p => {
                        const aff = allAffiliates.find(a => a.id === p.affiliate_id);
                        return (
                          <tr key={p.id} className="border-b border-border/50">
                            <td className="py-3 text-foreground font-bold">{aff?.name || "—"}</td>
                            <td className="py-3 text-green-600 font-bold">R$ {p.amount.toFixed(2).replace(".", ",")}</td>
                            <td className="py-3 text-muted-foreground text-xs">{p.pix_key || "—"}</td>
                            <td className="py-3 text-foreground">{p.paid_at ? format(new Date(p.paid_at), "dd/MM/yyyy") : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Afiliado</DialogTitle></DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Nome", key: "name" as const, type: "text" },
                  { label: "Email", key: "email" as const, type: "email" },
                  { label: "Instagram", key: "instagram" as const, type: "text", placeholder: "@usuario" },
                  { label: "Chave Pix", key: "pix_key" as const, type: "text", placeholder: "CPF, email ou telefone" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-sm font-bold text-muted-foreground mb-1 block">{f.label}</label>
                    <input type={f.type} value={editFields[f.key]} onChange={e => setEditFields({ ...editFields, [f.key]: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Canal</label>
                  <select value={editFields.channel_type} onChange={e => setEditFields({ ...editFields, channel_type: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option value="influencer">Influenciador</option>
                    <option value="partner">Parceiro</option>
                    <option value="creator">Creator</option>
                    <option value="vet">Veterinário</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Comissão (%)</label>
                  <input type="number" min={1} max={50} value={editCommission} onChange={e => setEditCommission(Number(e.target.value))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-3">
                <div><span className="text-muted-foreground">Cupom:</span> <span className="font-mono font-bold text-foreground">{selectedAffiliate.coupon_code || "—"}</span></div>
                <div><span className="text-muted-foreground">Ref:</span> <span className="font-mono text-foreground">{selectedAffiliate.ref_slug || "—"}</span></div>
                <div><span className="text-muted-foreground">Total ganho:</span> <span className="font-bold text-green-600">R$ {selectedAffiliate.total_earned.toFixed(2).replace(".", ",")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="font-bold text-foreground">{selectedAffiliate.status === "active" ? "Ativo" : selectedAffiliate.status === "pending" ? "Pendente" : "Suspenso"}</span></div>
              </div>

              <button onClick={async () => { await handleSaveEditFields(); await handleUpdateCommission(); }} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">
                Salvar Alterações
              </button>

              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-2">Vendas recentes</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sales.filter(s => s.affiliate_id === selectedAffiliate.id).slice(0, 10).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-muted rounded-lg p-2">
                      <span>{format(new Date(s.created_at), "dd/MM/yy")}</span>
                      <span>R$ {s.order_total.toFixed(2)}</span>
                      <span className="text-green-600 font-bold">R$ {s.commission_amount.toFixed(2)}</span>
                      <span className={`font-bold ${s.status === "confirmed" ? "text-blue-500" : s.status === "paid" ? "text-green-500" : "text-yellow-500"}`}>
                        {s.status === "confirmed" ? "✓" : s.status === "paid" ? "💰" : "⏳"}
                      </span>
                      {s.status === "pending" && <button onClick={() => handleConfirmSale(s)} className="text-blue-500 text-[10px] font-bold hover:underline">Confirmar</button>}
                    </div>
                  ))}
                  {sales.filter(s => s.affiliate_id === selectedAffiliate.id).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Sem vendas</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Affiliate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Afiliado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-1 block">Nome *</label>
              <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-1 block">Email *</label>
              <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="email@exemplo.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Instagram</label>
                <input value={addForm.instagram} onChange={e => setAddForm({ ...addForm, instagram: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="@usuario" />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Tipo de Canal</label>
                <select value={addForm.channel_type} onChange={e => setAddForm({ ...addForm, channel_type: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="influencer">Influenciador</option>
                  <option value="partner">Parceiro</option>
                  <option value="creator">Creator</option>
                  <option value="vet">Veterinário</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Comissão (%)</label>
                <input type="number" min={1} max={50} value={addForm.commission_percent} onChange={e => setAddForm({ ...addForm, commission_percent: Number(e.target.value) })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Chave Pix</label>
                <input value={addForm.pix_key} onChange={e => setAddForm({ ...addForm, pix_key: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="CPF, email ou telefone" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addForm.autoApprove} onChange={e => setAddForm({ ...addForm, autoApprove: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-foreground">Aprovar automaticamente (gera cupom e link)</span>
            </label>
            <button onClick={handleAddAffiliate} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">Adicionar Afiliado</button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
