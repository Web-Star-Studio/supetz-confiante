import { useMemo } from "react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ComposedChart, Line, Area, PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, Target, TrendingUp, Users, ShoppingCart, Megaphone,
  Package, Zap, ArrowUpRight, ArrowDownRight, Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface CrossModuleProps {
  orders: any[];
  profiles: number;
  products: any[];
  campaigns: any[];
  recipients: number;
  expenses: any[];
  funnelData: { lead: number; active: number; inactive: number; vip: number };
  lowStockCount: number;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export default function CrossModuleInsights({
  orders, profiles, products, campaigns, recipients, expenses, funnelData, lowStockCount,
}: CrossModuleProps) {
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);
  const totalRevenue = useMemo(() => activeOrders.reduce((s, o) => s + Number(o.total), 0), [activeOrders]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e: any) => s + Number(e.amount), 0), [expenses]);

  // 1. Business Health Radar
  const radarData = useMemo(() => {
    const totalCustomers = profiles;
    const activeProducts = products.filter((p: any) => p.active).length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === "active" || c.status === "sent").length;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const retentionRate = totalCustomers > 0
      ? ((funnelData.active + funnelData.vip) / totalCustomers) * 100
      : 0;
    const stockHealth = products.length > 0
      ? ((products.length - lowStockCount) / products.length) * 100
      : 100;
    const catalogDiversity = Math.min(activeProducts * 15, 100);
    const marketingReach = totalCustomers > 0
      ? Math.min((recipients / totalCustomers) * 100, 100)
      : 0;

    return [
      { metric: "Margem", value: Math.max(0, Math.min(margin, 100)), fullMark: 100 },
      { metric: "Retenção", value: Math.min(retentionRate, 100), fullMark: 100 },
      { metric: "Estoque", value: stockHealth, fullMark: 100 },
      { metric: "Catálogo", value: catalogDiversity, fullMark: 100 },
      { metric: "Marketing", value: marketingReach, fullMark: 100 },
      { metric: "Conversão", value: totalCustomers > 0 ? Math.min((activeOrders.length / totalCustomers) * 100, 100) : 0, fullMark: 100 },
    ];
  }, [profiles, products, campaigns, totalRevenue, totalExpenses, funnelData, lowStockCount, recipients, activeOrders]);

  // 2. Monthly cross-module trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" });

      const monthOrders = activeOrders.filter((o) => o.created_at.startsWith(key));
      const monthExpenses = expenses.filter((e: any) => e.date?.startsWith(key));
      const rev = monthOrders.reduce((s, o) => s + Number(o.total), 0);
      const exp = monthExpenses.reduce((s, e: any) => s + Number(e.amount), 0);

      // Unique buyers this month
      const uniqueBuyers = new Set(monthOrders.map((o) => o.user_id)).size;

      data.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        revenue: Math.round(rev),
        expenses: Math.round(exp),
        profit: Math.round(rev - exp),
        orders: monthOrders.length,
        buyers: uniqueBuyers,
      });
    }
    return data;
  }, [activeOrders, expenses]);

  // 3. Customer segmentation performance
  const segmentPerformance = useMemo(() => {
    const totalCustomers = profiles;
    const totalFunnel = funnelData.lead + funnelData.active + funnelData.inactive + funnelData.vip;

    return [
      { name: "Leads", value: funnelData.lead, color: "#3b82f6", percent: totalFunnel > 0 ? (funnelData.lead / totalFunnel) * 100 : 0 },
      { name: "Ativos", value: funnelData.active, color: "#22c55e", percent: totalFunnel > 0 ? (funnelData.active / totalFunnel) * 100 : 0 },
      { name: "Inativos", value: funnelData.inactive, color: "#f59e0b", percent: totalFunnel > 0 ? (funnelData.inactive / totalFunnel) * 100 : 0 },
      { name: "VIP", value: funnelData.vip, color: "#8b5cf6", percent: totalFunnel > 0 ? (funnelData.vip / totalFunnel) * 100 : 0 },
    ];
  }, [funnelData, profiles]);

  // 4. Cross-module KPIs
  const crossKPIs = useMemo(() => {
    const avgTicket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
    const revenuePerCustomer = profiles > 0 ? totalRevenue / profiles : 0;
    const costPerOrder = activeOrders.length > 0 ? totalExpenses / activeOrders.length : 0;
    const marketingExpenses = expenses.filter((e: any) => e.category === "marketing" || e.category === "advertising").reduce((s, e: any) => s + Number(e.amount), 0);
    const cac = profiles > 0 ? marketingExpenses / profiles : 0;
    const campaignROI = marketingExpenses > 0 ? ((totalRevenue - marketingExpenses) / marketingExpenses) * 100 : 0;
    const productUtilization = products.length > 0 ? (products.filter((p: any) => p.active && p.quantity > 0).length / products.length) * 100 : 0;

    return { avgTicket, revenuePerCustomer, costPerOrder, cac, campaignROI, productUtilization };
  }, [activeOrders, totalRevenue, totalExpenses, profiles, expenses, products]);

  // 5. Top action items
  const actionItems = useMemo(() => {
    const items: { text: string; priority: "high" | "medium" | "low"; module: string; link: string }[] = [];

    if (lowStockCount > 0) items.push({ text: `${lowStockCount} produto(s) com estoque baixo`, priority: "high", module: "Estoque", link: "/admin/estoque" });
    if (funnelData.inactive > funnelData.active) items.push({ text: "Mais inativos que ativos — lance uma campanha de reativação", priority: "high", module: "CRM", link: "/admin/crm" });
    if (crossKPIs.campaignROI < 100 && crossKPIs.campaignROI > 0) items.push({ text: `ROI de marketing em ${crossKPIs.campaignROI.toFixed(0)}% — otimize campanhas`, priority: "medium", module: "Marketing", link: "/admin/marketing" });
    if (totalRevenue > 0 && (totalRevenue - totalExpenses) / totalRevenue < 0.15) items.push({ text: "Margem líquida abaixo de 15% — revise custos", priority: "medium", module: "Financeiro", link: "/admin/financeiro" });
    if (funnelData.vip > 0) items.push({ text: `${funnelData.vip} cliente(s) VIP — crie ofertas exclusivas`, priority: "low", module: "CRM", link: "/admin/crm" });
    if (campaigns.filter((c: any) => c.status === "active").length === 0) items.push({ text: "Nenhuma campanha ativa — considere criar uma", priority: "medium", module: "Marketing", link: "/admin/marketing" });

    return items.slice(0, 5);
  }, [lowStockCount, funnelData, crossKPIs, totalRevenue, totalExpenses, campaigns]);

  const overallScore = useMemo(() => {
    const avg = radarData.reduce((s, d) => s + d.value, 0) / radarData.length;
    return Math.round(avg);
  }, [radarData]);

  const scoreColor = overallScore >= 70 ? "text-emerald-600" : overallScore >= 40 ? "text-amber-500" : "text-destructive";
  const scoreBg = overallScore >= 70 ? "bg-emerald-500" : overallScore >= 40 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="space-y-6">
      {/* Overall Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col items-center justify-center">
          <Activity className={`w-6 h-6 mb-2 ${scoreColor}`} />
          <p className={`text-5xl font-extrabold ${scoreColor}`}>{overallScore}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-1">Score Geral do Negócio</p>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mt-3">
            <motion.div initial={{ width: 0 }} animate={{ width: `${overallScore}%` }} transition={{ duration: 1 }}
              className={`h-full rounded-full ${scoreBg}`} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 w-full">
            {[
              { label: "Receita/Cliente", value: fmt(crossKPIs.revenuePerCustomer) },
              { label: "Custo/Pedido", value: fmt(crossKPIs.costPerOrder) },
              { label: "Catálogo Ativo", value: `${crossKPIs.productUtilization.toFixed(0)}%` },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center">
                <p className="text-xs font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Radar de Saúde</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid strokeOpacity={0.2} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Action Items */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Ações Prioritárias</p>
          </div>
          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Star className="w-8 h-8 text-emerald-500/30 mb-2" />
              <p className="text-xs text-muted-foreground">Tudo em ordem! Continue assim.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item, i) => (
                <Link key={i} to={item.link} className={`flex items-start gap-2 p-2.5 rounded-xl transition-all hover:scale-[1.01] ${
                  item.priority === "high" ? "bg-destructive/8 hover:bg-destructive/12" : item.priority === "medium" ? "bg-amber-500/8 hover:bg-amber-500/12" : "bg-emerald-500/8 hover:bg-emerald-500/12"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    item.priority === "high" ? "bg-destructive" : item.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-foreground leading-tight">{item.text}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{item.module}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cross-module KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ticket Médio", value: fmt(crossKPIs.avgTicket), icon: ShoppingCart, color: "bg-primary/15 text-primary" },
          { label: "CAC Estimado", value: fmt(crossKPIs.cac), icon: Users, color: "bg-violet-500/15 text-violet-600" },
          { label: "ROI Marketing", value: `${crossKPIs.campaignROI.toFixed(0)}%`, icon: Megaphone, color: crossKPIs.campaignROI >= 100 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600" },
          { label: "Utilização Catálogo", value: `${crossKPIs.productUtilization.toFixed(0)}%`, icon: Package, color: "bg-blue-500/15 text-blue-600" },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">{kpi.label}</p>
              <p className="text-lg font-extrabold text-foreground">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Tendência Cross-Module (6 meses)</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="crossRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v: number, name: string) => [name === "Compradores" || name === "Pedidos" ? v : fmt(v), name]}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Receita" stroke="hsl(142, 71%, 45%)" fill="url(#crossRevGrad)" strokeWidth={2} />
              <Bar yAxisId="left" dataKey="expenses" name="Despesas" fill="hsl(0, 84%, 60%, 0.4)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="buyers" name="Compradores" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Segments Pie */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Segmentos de Clientes</p>
          </div>
          {segmentPerformance.some((s) => s.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={segmentPerformance} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {segmentPerformance.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => v} contentStyle={{ borderRadius: "12px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {segmentPerformance.map((seg) => (
                  <div key={seg.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-muted-foreground">{seg.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{seg.value}</span>
                      <span className="text-muted-foreground w-10 text-right">{seg.percent.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Sem dados de segmentação</div>
          )}
        </div>
      </div>
    </div>
  );
}
