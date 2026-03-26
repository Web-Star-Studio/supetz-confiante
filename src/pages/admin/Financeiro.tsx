import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Trash2, Download, BarChart3, PieChart, Activity, Target,
  AlertTriangle, CheckCircle2, Lightbulb, Edit3, X, Save, Calendar,
  Zap, ShieldCheck, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RPieChart, Pie, Cell, Legend, ComposedChart, Line,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
  recurring_period: string | null;
  created_at: string;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  product: { label: "Produto", color: "hsl(var(--primary))" },
  shipping: { label: "Frete", color: "#6366f1" },
  marketing: { label: "Marketing", color: "#f59e0b" },
  platform: { label: "Plataforma", color: "#06b6d4" },
  salary: { label: "Salários", color: "#8b5cf6" },
  tax: { label: "Impostos", color: "#ef4444" },
  other: { label: "Outros", color: "#94a3b8" },
};

type Period = "7d" | "30d" | "90d" | "1y" | "all";

function getPeriodMs(period: Period): number | null {
  switch (period) {
    case "7d": return 7 * 86400000;
    case "30d": return 30 * 86400000;
    case "90d": return 90 * 86400000;
    case "1y": return 365 * 86400000;
    case "all": return null;
  }
}

function getPeriodStart(period: Period): Date | null {
  const ms = getPeriodMs(period);
  return ms ? new Date(Date.now() - ms) : null;
}

export default function AdminFinanceiro() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  const [expForm, setExpForm] = useState({
    category: "other", description: "", amount: 0,
    date: new Date().toISOString().slice(0, 10),
    recurring: false, recurring_period: "monthly",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, expensesRes] = await Promise.all([
      supabase.from("orders").select("id, total, status, created_at").order("created_at", { ascending: true }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);
    setOrders((ordersRes.data as Order[]) || []);
    setExpenses((expensesRes.data as Expense[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const periodStart = getPeriodStart(period);

  const filteredOrders = useMemo(() => {
    if (!periodStart) return orders;
    return orders.filter((o) => new Date(o.created_at) >= periodStart);
  }, [orders, periodStart]);

  const filteredExpenses = useMemo(() => {
    if (!periodStart) return expenses;
    return expenses.filter((e) => new Date(e.date) >= periodStart);
  }, [expenses, periodStart]);

  // Previous period data for comparison
  const prevPeriodData = useMemo(() => {
    const ms = getPeriodMs(period);
    if (!ms) return { revenue: 0, expenses: 0, orders: 0 };
    const prevStart = new Date(Date.now() - ms * 2);
    const prevEnd = new Date(Date.now() - ms);
    const prevOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= prevStart && d < prevEnd && o.status !== "cancelled";
    });
    const prevExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= prevStart && d < prevEnd;
    });
    return {
      revenue: prevOrders.reduce((s, o) => s + Number(o.total), 0),
      expenses: prevExpenses.reduce((s, e) => s + Number(e.amount), 0),
      orders: prevOrders.length,
    };
  }, [orders, expenses, period]);

  // KPIs
  const activeOrders = useMemo(() => filteredOrders.filter((o) => o.status !== "cancelled"), [filteredOrders]);
  const totalRevenue = useMemo(() => activeOrders.reduce((s, o) => s + Number(o.total), 0), [activeOrders]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const orderCount = activeOrders.length;
  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

  // % changes
  const revenueChange = prevPeriodData.revenue > 0 ? ((totalRevenue - prevPeriodData.revenue) / prevPeriodData.revenue) * 100 : 0;
  const expenseChange = prevPeriodData.expenses > 0 ? ((totalExpenses - prevPeriodData.expenses) / prevPeriodData.expenses) * 100 : 0;
  const prevProfit = prevPeriodData.revenue - prevPeriodData.expenses;
  const profitChange = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;
  const prevTicket = prevPeriodData.orders > 0 ? prevPeriodData.revenue / prevPeriodData.orders : 0;
  const ticketChange = prevTicket > 0 ? ((avgTicket - prevTicket) / prevTicket) * 100 : 0;

  // Revenue chart data
  const revenueChartData = useMemo(() => {
    const grouped: Record<string, { date: string; revenue: number; expenses: number; profit: number }> = {};
    const useMonth = period === "1y" || period === "all";

    activeOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = useMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, expenses: 0, profit: 0 };
      grouped[key].revenue += Number(o.total);
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = useMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : e.date;
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, expenses: 0, profit: 0 };
      grouped[key].expenses += Number(e.amount);
    });

    return Object.values(grouped)
      .map((d) => ({ ...d, profit: d.revenue - d.expenses }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeOrders, filteredExpenses, period]);

  // Expenses by category (pie chart)
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(grouped)
      .map(([category, amount]) => ({
        name: categoryLabels[category]?.label || category,
        value: Math.round(amount * 100) / 100,
        color: categoryLabels[category]?.color || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const months: Record<string, { month: string; label: string; revenue: number; expenses: number; profit: number; orders: number }> = {};
    
    activeOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) {
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        months[key] = { month: key, label: label.charAt(0).toUpperCase() + label.slice(1), revenue: 0, expenses: 0, profit: 0, orders: 0 };
      }
      months[key].revenue += Number(o.total);
      months[key].orders += 1;
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) {
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        months[key] = { month: key, label: label.charAt(0).toUpperCase() + label.slice(1), revenue: 0, expenses: 0, profit: 0, orders: 0 };
      }
      months[key].expenses += Number(e.amount);
    });

    return Object.values(months)
      .map((m) => ({ ...m, profit: m.revenue - m.expenses }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [activeOrders, filteredExpenses]);

  // Cash flow forecast (next 3 months)
  const forecastData = useMemo(() => {
    const last3Months = monthlyBreakdown.slice(0, 3);
    if (last3Months.length === 0) return [];

    const avgRevenue = last3Months.reduce((s, m) => s + m.revenue, 0) / last3Months.length;
    const recurringCost = expenses.filter((e) => e.recurring).reduce((s, e) => s + Number(e.amount), 0);
    const avgNonRecurring = last3Months.length > 0
      ? (last3Months.reduce((s, m) => s + m.expenses, 0) / last3Months.length) - recurringCost
      : 0;

    const forecast = [];
    // Add real months
    for (const m of [...last3Months].reverse()) {
      forecast.push({ label: m.label, revenue: Math.round(m.revenue), expenses: Math.round(m.expenses), type: "real" as const });
    }
    // Project 3 months
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const growth = 1 + (i * 0.02); // 2% optimistic growth/month
      forecast.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        revenue: Math.round(avgRevenue * growth),
        expenses: Math.round(recurringCost + Math.max(0, avgNonRecurring)),
        type: "forecast" as const,
      });
    }
    return forecast;
  }, [monthlyBreakdown, expenses]);

  // Financial health score
  const healthScore = useMemo(() => {
    let score = 50; // base
    const insights: { type: "success" | "warning" | "danger" | "tip"; text: string }[] = [];

    // Margin check
    if (margin >= 30) { score += 20; insights.push({ type: "success", text: "Margem de lucro excelente (>30%)" }); }
    else if (margin >= 15) { score += 10; insights.push({ type: "success", text: "Margem de lucro saudável (>15%)" }); }
    else if (margin >= 0) { score += 0; insights.push({ type: "warning", text: "Margem de lucro baixa — considere otimizar custos" }); }
    else { score -= 15; insights.push({ type: "danger", text: "Operação no prejuízo — ação urgente necessária" }); }

    // Revenue trend
    if (revenueChange > 10) { score += 15; insights.push({ type: "success", text: `Receita crescendo ${revenueChange.toFixed(0)}% vs período anterior` }); }
    else if (revenueChange > 0) { score += 5; }
    else if (revenueChange < -10) { score -= 10; insights.push({ type: "warning", text: `Receita caiu ${Math.abs(revenueChange).toFixed(0)}% vs período anterior` }); }

    // Expense control
    if (expenseChange > 20) { score -= 10; insights.push({ type: "warning", text: `Despesas cresceram ${expenseChange.toFixed(0)}% — revisar gastos` }); }
    else if (expenseChange < 0) { score += 5; insights.push({ type: "success", text: "Despesas sendo otimizadas" }); }

    // Recurring expenses ratio
    const recurringTotal = filteredExpenses.filter((e) => e.recurring).reduce((s, e) => s + Number(e.amount), 0);
    const recurringRatio = totalExpenses > 0 ? (recurringTotal / totalExpenses) * 100 : 0;
    if (recurringRatio > 70) { insights.push({ type: "tip", text: `${recurringRatio.toFixed(0)}% das despesas são recorrentes — negocie contratos` }); }

    // Diversification check
    if (expensesByCategory.length > 0 && expensesByCategory[0].value / totalExpenses > 0.6) {
      insights.push({ type: "tip", text: `"${expensesByCategory[0].name}" representa ${((expensesByCategory[0].value / totalExpenses) * 100).toFixed(0)}% dos custos — diversifique` });
    }

    // Ticket check
    if (avgTicket > 0 && ticketChange < -15) {
      insights.push({ type: "warning", text: `Ticket médio caiu ${Math.abs(ticketChange).toFixed(0)}% — considere upselling` });
    }

    return { score: Math.min(100, Math.max(0, score)), insights };
  }, [margin, revenueChange, expenseChange, filteredExpenses, totalExpenses, expensesByCategory, avgTicket, ticketChange]);

  async function handleAddExpense() {
    if (!expForm.description.trim() || expForm.amount <= 0 || !user) return;
    setSaving(true);
    await supabase.from("expenses").insert({
      category: expForm.category, description: expForm.description, amount: expForm.amount,
      date: expForm.date, recurring: expForm.recurring,
      recurring_period: expForm.recurring ? expForm.recurring_period : null, created_by: user.id,
    });
    setExpForm({ category: "other", description: "", amount: 0, date: new Date().toISOString().slice(0, 10), recurring: false, recurring_period: "monthly" });
    setShowAddExpense(false);
    setSaving(false);
    log({ action: "create", entity_type: "expense", details: { description: expForm.description, amount: expForm.amount } });
    fetchData();
  }

  async function handleDeleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    log({ action: "delete", entity_type: "expense", entity_id: id });
    fetchData();
  }

  async function handleEditSave() {
    if (!editingId || !editForm.description?.trim() || !editForm.amount) return;
    setSaving(true);
    await supabase.from("expenses").update({
      category: editForm.category, description: editForm.description,
      amount: editForm.amount, date: editForm.date,
      recurring: editForm.recurring,
      recurring_period: editForm.recurring ? editForm.recurring_period : null,
    }).eq("id", editingId);
    log({ action: "update", entity_type: "expense", entity_id: editingId });
    setEditingId(null);
    setSaving(false);
    fetchData();
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id);
    setEditForm({ ...exp });
  }

  function exportCSV() {
    const rows = [
      ["Tipo", "Data", "Descrição", "Categoria", "Valor"],
      ...activeOrders.map((o) => [
        "Receita", new Date(o.created_at).toLocaleDateString("pt-BR"), `Pedido #${o.id.slice(0, 8)}`, "Venda", o.total.toFixed(2),
      ]),
      ...filteredExpenses.map((e) => [
        "Despesa", new Date(e.date).toLocaleDateString("pt-BR"), e.description, categoryLabels[e.category]?.label || e.category, (-e.amount).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  function ChangeIndicator({ value, invert }: { value: number; invert?: boolean }) {
    if (value === 0) return null;
    const positive = invert ? value < 0 : value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${positive ? "text-emerald-600" : "text-destructive"}`}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  }

  const healthColor = healthScore.score >= 70 ? "text-emerald-600" : healthScore.score >= 40 ? "text-amber-500" : "text-destructive";
  const healthBg = healthScore.score >= 70 ? "bg-emerald-500" : healthScore.score >= 40 ? "bg-amber-500" : "bg-destructive";

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Receitas, despesas, previsões e saúde financeira</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "1y", "all"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                period === p ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "Tudo" : p}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card text-muted-foreground hover:text-primary text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards with comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Receita", value: totalRevenue, change: revenueChange, icon: TrendingUp, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
          { label: "Despesas", value: totalExpenses, change: expenseChange, icon: TrendingDown, iconBg: "bg-destructive/15", iconColor: "text-destructive", invert: true },
          { label: "Lucro", value: profit, change: profitChange, icon: profit >= 0 ? ArrowUpRight : ArrowDownRight, iconBg: profit >= 0 ? "bg-emerald-500/15" : "bg-destructive/15", iconColor: profit >= 0 ? "text-emerald-600" : "text-destructive", valueColor: profit >= 0 ? "text-emerald-600" : "text-destructive" },
          { label: "Ticket médio", value: avgTicket, change: ticketChange, icon: DollarSign, iconBg: "bg-primary/15", iconColor: "text-primary" },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${kpi.iconBg} flex items-center justify-center`}>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                {period !== "all" && <ChangeIndicator value={kpi.change} invert={kpi.invert} />}
              </div>
              <p className={`text-lg font-extrabold ${kpi.valueColor || "text-foreground"}`}>{formatCurrency(kpi.value)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Financial Health Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-2xl ${healthScore.score >= 70 ? "bg-emerald-500/15" : healthScore.score >= 40 ? "bg-amber-500/15" : "bg-destructive/15"} flex items-center justify-center`}>
            <ShieldCheck className={`w-5 h-5 ${healthColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Saúde Financeira</p>
              <p className={`text-2xl font-extrabold ${healthColor}`}>{healthScore.score}<span className="text-sm">/100</span></p>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mt-1.5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore.score}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${healthBg}`} />
            </div>
          </div>
        </div>
        {healthScore.insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {healthScore.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {insight.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />}
                {insight.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />}
                {insight.type === "danger" && <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />}
                {insight.type === "tip" && <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />}
                <span className="text-muted-foreground">{insight.text}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Margin bar */}
      <div className="bg-card rounded-3xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-foreground">Margem de lucro</p>
          <p className={`text-sm font-extrabold ${margin >= 0 ? "text-emerald-600" : "text-destructive"}`}>{margin.toFixed(1)}%</p>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, margin))}%` }} transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${margin >= 20 ? "bg-emerald-500" : margin >= 0 ? "bg-amber-500" : "bg-destructive"}`} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="bg-card rounded-2xl p-1">
          <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="forecast" className="rounded-xl text-xs font-semibold"><Zap className="w-3.5 h-3.5 mr-1.5" />Previsão</TabsTrigger>
          <TabsTrigger value="breakdown" className="rounded-xl text-xs font-semibold"><Calendar className="w-3.5 h-3.5 mr-1.5" />Mensal</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Receita vs Despesas vs Lucro</p>
              </div>
              {loading ? (
                <div className="h-64 animate-pulse bg-border/30 rounded-2xl" />
              ) : revenueChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%, 0.15)" name="Receita" />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%, 0.15)" name="Despesas" />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Lucro" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Despesas por categoria</p>
              </div>
              {expensesByCategory.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Sem despesas</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <RPieChart>
                      <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {expensesByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expensesByCategory.map((e) => (
                      <span key={e.name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: e.color + "22", color: e.color }}>
                        {e.name}: {formatCurrency(e.value)}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast">
          <div className="bg-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Previsão de Fluxo de Caixa (3 meses)</p>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Baseado na média dos últimos meses e despesas recorrentes. Barras tracejadas = projeção.</p>
            {forecastData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Dados insuficientes para previsão</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {forecastData.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-2xl flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Projeção de lucro nos próximos 3 meses:{" "}
                  <span className="font-bold text-foreground">
                    {formatCurrency(forecastData.filter((d) => d.type === "forecast").reduce((s, d) => s + d.revenue - d.expenses, 0))}
                  </span>
                  . Adicione despesas recorrentes para melhorar a precisão.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Monthly Breakdown Tab */}
        <TabsContent value="breakdown">
          <div className="bg-card rounded-3xl p-5 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Detalhamento Mensal</p>
            </div>
            {monthlyBreakdown.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Mês</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pedidos</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Receita</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Despesas</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Lucro</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyBreakdown.map((m) => {
                    const mMargin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
                    return (
                      <tr key={m.month} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">{m.label}</td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">{m.orders}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{formatCurrency(m.revenue)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-destructive">{formatCurrency(m.expenses)}</td>
                        <td className={`py-2.5 px-3 text-right font-extrabold ${m.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatCurrency(m.profit)}</td>
                        <td className={`py-2.5 px-3 text-right font-semibold ${mMargin >= 15 ? "text-emerald-600" : mMargin >= 0 ? "text-amber-500" : "text-destructive"}`}>{mMargin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-2.5 px-3 font-extrabold text-foreground">Total</td>
                    <td className="py-2.5 px-3 text-right font-bold text-muted-foreground">{monthlyBreakdown.reduce((s, m) => s + m.orders, 0)}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">{formatCurrency(monthlyBreakdown.reduce((s, m) => s + m.revenue, 0))}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-destructive">{formatCurrency(monthlyBreakdown.reduce((s, m) => s + m.expenses, 0))}</td>
                    <td className={`py-2.5 px-3 text-right font-extrabold ${monthlyBreakdown.reduce((s, m) => s + m.profit, 0) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {formatCurrency(monthlyBreakdown.reduce((s, m) => s + m.profit, 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-foreground">{margin.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Expenses section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-foreground">Despesas</h2>
        <button onClick={() => setShowAddExpense(!showAddExpense)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Add expense form */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="bg-card rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
                  <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor (R$)</label>
                  <input type="number" min={0} step={0.01} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data</label>
                  <input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={expForm.recurring} onChange={(e) => setExpForm({ ...expForm, recurring: e.target.checked })} className="rounded" />
                    <span className="text-xs font-semibold text-muted-foreground">Recorrente</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Descrição da despesa..." className="flex-1 px-4 py-2.5 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={handleAddExpense} disabled={saving || !expForm.description.trim() || expForm.amount <= 0} className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expenses list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-3xl p-5 h-16 animate-pulse" />)}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhuma despesa registrada no período.</div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp, i) => {
            const cat = categoryLabels[exp.category] || categoryLabels.other;
            const isEditing = editingId === exp.id;

            return (
              <motion.div key={exp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 p-4 bg-card rounded-3xl group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "22" }}>
                  <DollarSign className="w-4 h-4" style={{ color: cat.color }} />
                </div>

                {isEditing ? (
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="px-2 py-1.5 rounded-xl bg-muted text-foreground text-xs">
                      {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs" />
                    <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className="w-24 px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs" />
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="px-2 py-1.5 rounded-xl bg-muted text-foreground text-xs" />
                    <button onClick={handleEditSave} disabled={saving} className="p-1.5 rounded-lg bg-emerald-500 text-white"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{exp.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "22", color: cat.color }}>{cat.label}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(exp.date).toLocaleDateString("pt-BR")}</span>
                        {exp.recurring && <span className="text-[10px] text-muted-foreground">🔄 {exp.recurring_period}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-destructive flex-shrink-0">-{formatCurrency(Number(exp.amount))}</p>
                    <button onClick={() => startEdit(exp)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all flex-shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
