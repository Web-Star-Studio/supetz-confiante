import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RevenueChart from "@/components/admin/RevenueChart";
import EmergencyAnalytics from "@/components/admin/EmergencyAnalytics";
import CrossModuleInsights from "@/components/admin/CrossModuleInsights";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Crown, UserPlus, UserCheck, UserX, Megaphone, DollarSign,
  Boxes, Eye, Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "7d" | "1m" | "3m" | "6m" | "1y";

const periodDays: Record<Period, number> = { "7d": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365 };

function StatsCard({ icon: Icon, label, value, color, delay, trend, to }: {
  icon: any; label: string; value: string; color: string; delay: number;
  trend?: { value: string; up: boolean }; to?: string;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-default"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-extrabold text-foreground truncate">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-2 py-1 flex-shrink-0 ${trend.up ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

function MiniCard({ icon: Icon, label, value, color, to }: {
  icon: any; label: string; value: string | number; color: string; to?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl hover:bg-muted transition-all">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-extrabold text-foreground">{value}</p>
      </div>
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

function buildChartData(orders: any[], days: number) {
  const result: { day: string; revenue: number; orders: number; date: string }[] = [];
  if (days <= 14) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dateStr = d.toDateString();
      const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      result.push({ day: dayStr, revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0), orders: dayOrders.length, date: d.toISOString() });
    }
  } else if (days <= 90) {
    const weeks = Math.ceil(days / 7);
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
      const label = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const weekOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= weekStart && d <= weekEnd; });
      result.push({ day: label, revenue: weekOrders.reduce((s, o) => s + Number(o.total), 0), orders: weekOrders.length, date: weekStart.toISOString() });
    }
  } else {
    const months = Math.ceil(days / 30);
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const monthOrders = orders.filter(o => { const od = new Date(o.created_at); return od >= monthStart && od <= monthEnd; });
      result.push({ day: label, revenue: monthOrders.reduce((s, o) => s + Number(o.total), 0), orders: monthOrders.length, date: monthStart.toISOString() });
    }
  }
  return result;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("1m");

  // Stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // CRM
  const [funnelData, setFunnelData] = useState({ lead: 0, active: 0, inactive: 0, vip: 0 });

  // Stock
  const [lowStockProducts, setLowStockProducts] = useState<{ title: string; quantity: number }[]>([]);
  const [outOfStock, setOutOfStock] = useState(0);

  // Marketing
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [totalCampaignRecipients, setTotalCampaignRecipients] = useState(0);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);

  // Financial
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Expenses chart
  const [expensesByMonth, setExpensesByMonth] = useState<{ month: string; amount: number }[]>([]);

  useEffect(() => {
    async function fetchAll() {
      const [
        ordersRes, productsRes, profilesRes, statusRes,
        campaignsRes, recipientsRes, expensesRes,
      ] = await Promise.all([
        supabase.from("orders").select("id, total, status, customer_name, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(10000),
        supabase.from("products").select("id, title, quantity, low_stock_threshold, active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("customer_status").select("status"),
        supabase.from("campaigns").select("id, status"),
        supabase.from("campaign_recipients").select("id", { count: "exact", head: true }),
        supabase.from("expenses").select("amount, date, category").limit(10000),
      ]);

      const orders = ordersRes.data || [];
      const products = (productsRes.data || []) as any[];
      const statuses = statusRes.data || [];
      const campaigns = campaignsRes.data || [];
      const expenses = expensesRes.data || [];

      // Orders
      const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrd = orders.filter(o => new Date(o.created_at) >= today);

      setAllOrders(orders);
      setTotalOrders(orders.length);
      setTotalRevenue(revenue);
      setTotalProducts(products.length);
      setTotalCustomers(profilesRes.count || 0);
      setTodayOrders(todayOrd.length);
      setTodayRevenue(todayOrd.reduce((s, o) => s + Number(o.total), 0));
      setRecentOrders(orders.slice(0, 5));

      // CRM funnel
      const funnel = { lead: 0, active: 0, inactive: 0, vip: 0 };
      statuses.forEach((s: any) => { if (s.status in funnel) funnel[s.status as keyof typeof funnel]++; });
      setFunnelData(funnel);

      // Stock
      const lowStock = products.filter(p => p.quantity <= (p.low_stock_threshold || 5) && p.quantity > 0 && p.active);
      setLowStockProducts(lowStock.map(p => ({ title: p.title, quantity: p.quantity })).slice(0, 5));
      setOutOfStock(products.filter(p => p.quantity === 0 && p.active).length);

      // Marketing
      setActiveCampaigns(campaigns.filter((c: any) => c.status === "active").length);
      setTotalCampaignRecipients(recipientsRes.count || 0);

      // Expenses
      const totalExp = expenses.reduce((s, e: any) => s + Number(e.amount), 0);
      setTotalExpenses(totalExp);

      // Expenses by month (last 6)
      const expByMonth: Record<string, number> = {};
      expenses.forEach((e: any) => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        expByMonth[key] = (expByMonth[key] || 0) + Number(e.amount);
      });
      setExpensesByMonth(
        Object.entries(expByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, amount]) => ({
            month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
            amount,
          }))
      );

      setLoading(false);
    }
    fetchAll();
  }, []);

  const chartData = useMemo(() => {
    const days = periodDays[period];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const filtered = allOrders.filter(o => new Date(o.created_at) >= cutoff);
    return buildChartData(filtered, days);
  }, [allOrders, period]);

  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-500/15 text-amber-700" },
    confirmed: { label: "Confirmado", className: "bg-blue-500/15 text-blue-700" },
    shipped: { label: "Enviado", className: "bg-violet-500/15 text-violet-700" },
    delivered: { label: "Entregue", className: "bg-emerald-500/15 text-emerald-700" },
    cancelled: { label: "Cancelado", className: "bg-destructive/15 text-destructive" },
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão executiva consolidada</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-border" />
                <div className="space-y-2"><div className="h-3 w-16 rounded-full bg-border" /><div className="h-5 w-24 rounded-full bg-border" /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6 animate-pulse"><div className="h-48 rounded-xl bg-border" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão executiva consolidada</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard icon={TrendingUp} label="Receita Total" value={formatCurrency(totalRevenue)} color="bg-emerald-500/15 text-emerald-600" delay={0}
          trend={todayRevenue > 0 ? { value: `+R$${todayRevenue.toFixed(0)}`, up: true } : undefined} to="/admin/financeiro" />
        <StatsCard icon={ShoppingCart} label="Pedidos" value={String(totalOrders)} color="bg-primary/15 text-primary" delay={0.05}
          trend={todayOrders > 0 ? { value: `+${todayOrders} hoje`, up: true } : undefined} to="/admin/pedidos" />
        <StatsCard icon={Wallet} label="Lucro" value={formatCurrency(profit)} color={profit >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"} delay={0.1}
          trend={{ value: `${margin.toFixed(0)}% margem`, up: margin > 0 }} to="/admin/financeiro" />
        <StatsCard icon={DollarSign} label="Ticket Médio" value={formatCurrency(avgTicket)} color="bg-violet-500/15 text-violet-600" delay={0.15} />
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart data={chartData} period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Grid: CRM + Stock + Marketing + Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* CRM Funnel */}
        <Link to="/admin/crm" className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Funil CRM</p>
            <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">Ver tudo →</span>
          </div>
          <div className="space-y-2">
            {[
              { key: "lead", label: "Leads", icon: UserPlus, color: "bg-blue-500/15 text-blue-600" },
              { key: "active", label: "Ativos", icon: UserCheck, color: "bg-emerald-500/15 text-emerald-600" },
              { key: "inactive", label: "Inativos", icon: UserX, color: "bg-amber-500/15 text-amber-600" },
              { key: "vip", label: "VIP", icon: Crown, color: "bg-violet-500/15 text-violet-600" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-3 h-3" />
                </div>
                <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                <span className="text-sm font-extrabold text-foreground">{funnelData[item.key as keyof typeof funnelData]}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Stock Alerts */}
        <Link to="/admin/estoque" className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-2 mb-4">
            <Boxes className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Estoque</p>
            <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">Ver tudo →</span>
          </div>
          <div className="space-y-2">
            {outOfStock > 0 && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">{outOfStock} sem estoque</span>
              </div>
            )}
            {lowStockProducts.length > 0 ? lowStockProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate flex-1">{p.title}</span>
                <span className="text-xs font-bold text-amber-600 ml-2">{p.quantity} un.</span>
              </div>
            )) : (
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-xl">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">Estoque saudável</span>
              </div>
            )}
          </div>
        </Link>

        {/* Marketing */}
        <Link to="/admin/marketing" className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Marketing</p>
            <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">Ver tudo →</span>
          </div>
          <div className="space-y-3">
            <MiniCard icon={Megaphone} label="Campanhas ativas" value={activeCampaigns} color="bg-primary/15 text-primary" />
            <MiniCard icon={Eye} label="Total alcançados" value={totalCampaignRecipients} color="bg-emerald-500/15 text-emerald-600" />
          </div>
        </Link>

        {/* Financial summary */}
        <Link to="/admin/financeiro" className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Financeiro</p>
            <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">Ver tudo →</span>
          </div>
          {expensesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={expensesByMonth}>
                <Area type="monotone" dataKey="amount" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%, 0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "12px", fontSize: "11px" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">Total despesas</span>
            <span className="text-xs font-extrabold text-destructive">{formatCurrency(totalExpenses)}</span>
          </div>
        </Link>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <MiniCard icon={Users} label="Total clientes" value={totalCustomers} color="bg-violet-500/15 text-violet-600" to="/admin/crm" />
        <MiniCard icon={Package} label="Produtos" value={totalProducts} color="bg-blue-500/15 text-blue-600" to="/admin/produtos" />
        <MiniCard icon={AlertTriangle} label="Estoque baixo" value={lowStockProducts.length} color="bg-amber-500/15 text-amber-600" to="/admin/estoque" />
        <MiniCard icon={TrendingUp} label="Margem" value={`${margin.toFixed(1)}%`} color={margin >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"} to="/admin/financeiro" />
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-6">
        <div className="p-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Pedidos Recentes</h2>
          <Link to="/admin/pedidos" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Nenhum pedido</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground text-xs">ID</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground text-xs">Cliente</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground text-xs">Status</th>
                  <th className="text-right px-5 py-2.5 font-semibold text-muted-foreground text-xs">Total</th>
                  <th className="text-right px-5 py-2.5 font-semibold text-muted-foreground text-xs">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const st = statusLabels[order.status] || { label: order.status, className: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={order.id} className={`transition-colors hover:bg-primary/5 ${i % 2 === 1 ? "bg-muted/15" : ""}`}>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                      <td className="px-5 py-3 font-medium text-foreground text-xs">{order.customer_name || "—"}</td>
                      <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.className}`}>{st.label}</span></td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground text-xs">R$ {Number(order.total).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground text-[10px]">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Analytics */}
      <EmergencyAnalytics />
    </AdminLayout>
  );
}
