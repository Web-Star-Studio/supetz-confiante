import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Filter, Copy, CheckCircle, X, MapPin, ShoppingCart, Clock, Truck,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, BarChart3,
  TrendingUp, DollarSign, Download, Package, Users, Target, AlertTriangle,
  Zap, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, differenceInDays, differenceInHours } from "date-fns";

const PAGE_SIZE = 10;
type SortCol = "created_at" | "total" | "status" | "customer_name";
type SortDir = "asc" | "desc";

function SortIcon({ column, current, dir }: { column: string; current: string; dir: SortDir }) {
  if (column !== current) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortCol, setSortCol] = useState<SortCol>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [mainTab, setMainTab] = useState("pedidos");
  const { log } = useAuditLog();

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
    setPage(0);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from("orders").select("*", { count: "exact" }).order(sortCol, { ascending: sortDir === "asc" }).range(from, to);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) query = query.or(`customer_name.ilike.%${search.trim()}%,id.ilike.%${search.trim()}%`);

    const [pageRes, allRes] = await Promise.all([
      query,
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5000),
    ]);
    setOrders(pageRes.data || []);
    setTotalCount(pageRes.count || 0);
    setAllOrders(allRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page, search, sortCol, sortDir]);
  useEffect(() => { setPage(0); }, [statusFilter, search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    log({ action: "update", entity_type: "order", entity_id: orderId, details: { status: newStatus } });
    if (order?.customer_email && newStatus !== "pending") {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "order-status-update",
          recipientEmail: order.customer_email,
          idempotencyKey: `order-status-${orderId}-${newStatus}`,
          templateData: { customerName: order.customer_name || "Cliente", orderId, status: newStatus, total: Number(order.total).toFixed(2).replace(".", ",") },
        },
      });
    }
    fetchOrders();
  };

  const copyId = (id: string) => { navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmado", className: "bg-sky-100 text-sky-700" },
    shipped: { label: "Enviado", className: "bg-violet-100 text-violet-700" },
    delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelado", className: "bg-rose-100 text-rose-700" },
  };

  const formatAddress = (addr: any) => {
    if (!addr || typeof addr !== "object") return null;
    const parts = [addr.street, addr.number && `nº ${addr.number}`, addr.complement, addr.neighborhood, addr.city && addr.state && `${addr.city}/${addr.state}`, addr.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  // ─── Analytics ───
  const analytics = useMemo(() => {
    const now = new Date();
    const last30 = subDays(now, 30);
    const last60 = subDays(now, 60);
    const orders30 = allOrders.filter(o => new Date(o.created_at) >= last30);
    const orders60prev = allOrders.filter(o => { const d = new Date(o.created_at); return d >= last60 && d < last30; });

    // Revenue trend (30 days)
    const revByDay: Record<string, { receita: number; pedidos: number }> = {};
    for (let i = 29; i >= 0; i--) revByDay[format(subDays(now, i), "dd/MM")] = { receita: 0, pedidos: 0 };
    orders30.forEach(o => {
      const key = format(new Date(o.created_at), "dd/MM");
      if (revByDay[key]) { revByDay[key].receita += Number(o.total); revByDay[key].pedidos++; }
    });
    const revTrend = Object.entries(revByDay).map(([day, v]) => ({ day, ...v }));

    // Status funnel
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    allOrders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });
    const funnelData = Object.entries(statusCounts).map(([name, value]) => ({ name: statusLabels[name]?.label || name, value }));

    // KPIs
    const totalRevenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const revenue30 = orders30.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const revenue60prev = orders60prev.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const revenueGrowth = revenue60prev > 0 ? ((revenue30 - revenue60prev) / revenue60prev * 100) : (revenue30 > 0 ? 100 : 0);
    const avgTicket = allOrders.filter(o => o.status !== "cancelled").length > 0 ? totalRevenue / allOrders.filter(o => o.status !== "cancelled").length : 0;
    const cancelRate = allOrders.length > 0 ? (statusCounts.cancelled / allOrders.length * 100) : 0;
    const deliveryRate = allOrders.length > 0 ? (statusCounts.delivered / allOrders.length * 100) : 0;

    // SLA: time from pending to delivered (for delivered orders)
    const deliveredOrders = allOrders.filter(o => o.status === "delivered" && o.updated_at);
    const slaHours = deliveredOrders.map(o => differenceInHours(new Date(o.updated_at), new Date(o.created_at)));
    const avgSlaHours = slaHours.length > 0 ? slaHours.reduce((s, h) => s + h, 0) / slaHours.length : 0;
    const avgSlaDays = Math.round(avgSlaHours / 24 * 10) / 10;

    // Stale orders (pending > 48h)
    const staleOrders = allOrders.filter(o => o.status === "pending" && differenceInHours(now, new Date(o.created_at)) > 48);

    // Top products
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    allOrders.filter(o => o.status !== "cancelled").forEach(o => {
      if (Array.isArray(o.items)) {
        (o.items as any[]).forEach((item: any) => {
          const name = item.title || item.name || "Desconhecido";
          const qty = item.quantity || 1;
          const price = Number(item.price || 0);
          if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
          productMap[name].qty += qty;
          productMap[name].revenue += price * qty;
        });
      }
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Orders by hour of day
    const hourDist: number[] = new Array(24).fill(0);
    allOrders.forEach(o => { const h = new Date(o.created_at).getHours(); hourDist[h]++; });
    const hourData = hourDist.map((count, hour) => ({ hour: `${hour}h`, pedidos: count }));

    // Repeat customers
    const customerOrders: Record<string, number> = {};
    allOrders.forEach(o => { const key = o.user_id || o.customer_email; if (key) customerOrders[key] = (customerOrders[key] || 0) + 1; });
    const repeatCustomers = Object.values(customerOrders).filter(c => c > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0;

    return { revTrend, funnelData, totalRevenue, revenue30, revenueGrowth, avgTicket, cancelRate, deliveryRate, avgSlaDays, staleOrders, topProducts, hourData, repeatRate, repeatCustomers, totalCustomers };
  }, [allOrders]);

  const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444"];

  const exportCSV = () => {
    const headers = ["ID", "Cliente", "Email", "Telefone", "Status", "Total", "Data"];
    const rows = allOrders.map(o => [o.id, o.customer_name || "", o.customer_email || "", o.customer_phone || "", o.status, Number(o.total).toFixed(2), format(new Date(o.created_at), "dd/MM/yyyy")]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `pedidos-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie e analise os pedidos da loja</p>
        </div>
        <button onClick={exportCSV} className="bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted/80 transition">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total Pedidos", value: allOrders.length, icon: ShoppingCart, color: "text-primary" },
            { label: "Receita Total", value: `R$ ${analytics.totalRevenue.toFixed(0)}`, icon: DollarSign, color: "text-emerald-500" },
            { label: "Ticket Médio", value: `R$ ${analytics.avgTicket.toFixed(2).replace(".", ",")}`, icon: Target, color: "text-blue-500" },
            { label: "Taxa Entrega", value: `${analytics.deliveryRate.toFixed(1)}%`, icon: Truck, color: "text-violet-500" },
            { label: "Cancelamento", value: `${analytics.cancelRate.toFixed(1)}%`, icon: AlertTriangle, color: "text-rose-500" },
            { label: "SLA Médio", value: `${analytics.avgSlaDays}d`, icon: Clock, color: "text-amber-500" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card rounded-xl p-4">
              <kpi.icon className={`w-5 h-5 ${kpi.color} mb-1`} />
              <p className="text-xl font-black text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-muted mb-4">
          <TabsTrigger value="pedidos" className="gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Pedidos</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="produtos" className="gap-1"><Package className="w-3.5 h-3.5" /> Produtos</TabsTrigger>
          <TabsTrigger value="sla" className="gap-1"><Clock className="w-3.5 h-3.5" /> SLA</TabsTrigger>
        </TabsList>

        {/* ── PEDIDOS TAB ── */}
        <TabsContent value="pedidos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou ID..." className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-11 pr-8 py-3 rounded-2xl bg-card text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-card rounded-3xl p-6 space-y-0">{[1, 2, 3, 4].map(i => <div key={i} className="flex items-center gap-4 py-4 animate-pulse border-b border-border/30 last:border-0"><div className="h-4 w-16 rounded-full bg-border" /><div className="h-4 w-28 rounded-full bg-border" /><div className="h-6 w-20 rounded-full bg-border" /><div className="h-4 w-20 rounded-full bg-border ml-auto" /></div>)}</div>
          ) : (
            <div className="bg-card rounded-3xl overflow-hidden">
              {orders.length === 0 ? <div className="p-10 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="text-left px-6 py-3 font-semibold text-muted-foreground">ID</th>
                        <th className="text-left px-6 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("customer_name")}><span className="inline-flex items-center gap-1">Cliente <SortIcon column="customer_name" current={sortCol} dir={sortDir} /></span></th>
                        <th className="text-left px-6 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("status")}><span className="inline-flex items-center gap-1">Status <SortIcon column="status" current={sortCol} dir={sortDir} /></span></th>
                        <th className="text-right px-6 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("total")}><span className="inline-flex items-center gap-1 justify-end">Total <SortIcon column="total" current={sortCol} dir={sortDir} /></span></th>
                        <th className="text-right px-6 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("created_at")}><span className="inline-flex items-center gap-1 justify-end">Data <SortIcon column="created_at" current={sortCol} dir={sortDir} /></span></th>
                        <th className="text-center px-6 py-3 font-semibold text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, i) => {
                        const status = statusLabels[order.status] || { label: order.status, className: "bg-muted text-muted-foreground" };
                        return (
                          <tr key={order.id} className={`transition-colors hover:bg-primary/5 cursor-pointer ${i % 2 === 1 ? "bg-muted/30" : ""}`} onClick={() => setSelectedOrder(order)}>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{order.customer_name || "—"}</td>
                            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span></td>
                            <td className="px-6 py-4 text-right font-semibold text-foreground">R$ {Number(order.total).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                              <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="px-3 py-1.5 rounded-xl bg-muted text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="pending">Pendente</option>
                                <option value="confirmed">Confirmado</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors"><ChevronLeft className="w-4 h-4" /> Anterior</button>
              <span className="text-sm text-muted-foreground">{page + 1} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">Próximo <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </TabsContent>

        {/* ── ANALYTICS TAB ── */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue trend */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Receita e Pedidos (30 dias)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Area yAxisId="left" type="monotone" dataKey="receita" name="Receita (R$)" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    <Area yAxisId="right" type="monotone" dataKey="pedidos" name="Pedidos" stroke="#10b981" fill="rgba(16,185,129,0.2)" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-violet-500" /> Funil de Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.funnelData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                      {analytics.funnelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders by hour */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Pedidos por Hora do Dia</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="pedidos" name="Pedidos" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary cards */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Resumo Inteligente</h3>
              <div className="space-y-3">
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Crescimento Receita (30d)</p>
                  <p className={`text-2xl font-black ${analytics.revenueGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{analytics.revenueGrowth > 0 ? "+" : ""}{analytics.revenueGrowth.toFixed(1)}%</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Clientes Recorrentes</p>
                  <p className="text-2xl font-black text-foreground">{analytics.repeatCustomers} <span className="text-sm font-normal text-muted-foreground">de {analytics.totalCustomers} ({analytics.repeatRate.toFixed(1)}%)</span></p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Receita últimos 30 dias</p>
                  <p className="text-2xl font-black text-emerald-600">R$ {analytics.revenue30.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── PRODUTOS TAB ── */}
        <TabsContent value="produtos" className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Produtos Mais Vendidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Unidades</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground font-bold">{i + 1}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-foreground">{p.qty}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">R$ {p.revenue.toFixed(2).replace(".", ",")}</td>
                    </tr>
                  ))}
                  {analytics.topProducts.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Sem dados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top products chart */}
          {analytics.topProducts.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4">Receita por Produto</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary) / 0.7)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── SLA TAB ── */}
        <TabsContent value="sla" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground font-bold mb-1">SLA Médio de Entrega</p>
              <p className="text-2xl font-black text-foreground">{analytics.avgSlaDays} dias</p>
              <p className="text-xs text-muted-foreground">Tempo médio criação → entrega</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground font-bold mb-1">Taxa de Entrega</p>
              <p className="text-2xl font-black text-emerald-600">{analytics.deliveryRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Pedidos entregues com sucesso</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground font-bold mb-1">Pedidos Parados ({">"}48h)</p>
              <p className="text-2xl font-black text-rose-600">{analytics.staleOrders.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes há mais de 2 dias</p>
            </div>
          </div>

          {analytics.staleOrders.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Pedidos Parados (ação necessária)</h3>
              <div className="space-y-2">
                {analytics.staleOrders.slice(0, 10).map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{o.customer_name || "—"} · <span className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</span></p>
                      <p className="text-xs text-muted-foreground">R$ {Number(o.total).toFixed(2)} · {format(new Date(o.created_at), "dd/MM/yyyy HH:mm")} · {differenceInHours(new Date(), new Date(o.created_at))}h parado</p>
                    </div>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="px-3 py-1.5 rounded-xl bg-muted text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmar</option>
                      <option value="cancelled">Cancelar</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-muted rounded-3xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-foreground font-display">Detalhes do Pedido</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">{selectedOrder.id}</span>
                  <button onClick={() => copyId(selectedOrder.id)} className="text-muted-foreground hover:text-primary transition-colors">{copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground font-medium">Cliente</label><p className="text-sm font-semibold text-foreground">{selectedOrder.customer_name || "—"}</p></div>
                  <div><label className="text-xs text-muted-foreground font-medium">E-mail</label><p className="text-sm text-foreground">{selectedOrder.customer_email || "—"}</p></div>
                  <div><label className="text-xs text-muted-foreground font-medium">Telefone</label><p className="text-sm text-foreground">{selectedOrder.customer_phone || "—"}</p></div>
                  <div><label className="text-xs text-muted-foreground font-medium">Total</label><p className="text-sm font-bold text-foreground">R$ {Number(selectedOrder.total).toFixed(2)}</p></div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-2 block">Itens</label>
                  <div className="bg-card rounded-2xl p-4 space-y-2">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (selectedOrder.items as any[]).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm"><span className="text-foreground">{item.title || item.name || `Item ${idx + 1}`} × {item.quantity || 1}</span><span className="font-semibold text-foreground">R$ {Number(item.price || 0).toFixed(2)}</span></div>
                    )) : <p className="text-muted-foreground text-sm">Nenhum item.</p>}
                  </div>
                </div>
                {selectedOrder.shipping_address && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">Endereço</label>
                    <div className="bg-card rounded-2xl p-4 text-sm text-foreground flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>{(() => { const f = formatAddress(selectedOrder.shipping_address); return f ? <p>{f}</p> : <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(selectedOrder.shipping_address, null, 2)}</pre>; })()}</div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-2 block">Atualizar status</label>
                  <select value={selectedOrder.status} onChange={e => { updateStatus(selectedOrder.id, e.target.value); setSelectedOrder({ ...selectedOrder, status: e.target.value }); }} className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
