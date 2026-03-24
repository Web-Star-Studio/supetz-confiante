import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Trash2, Download, Calendar, BarChart3, PieChart,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
} from "recharts";

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

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "7d": return new Date(now.getTime() - 7 * 86400000);
    case "30d": return new Date(now.getTime() - 30 * 86400000);
    case "90d": return new Date(now.getTime() - 90 * 86400000);
    case "1y": return new Date(now.getTime() - 365 * 86400000);
    case "all": return null;
  }
}

export default function AdminFinanceiro() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Expense form
  const [expForm, setExpForm] = useState({
    category: "other",
    description: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    recurring: false,
    recurring_period: "monthly",
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

  // KPIs
  const totalRevenue = useMemo(() => filteredOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0), [filteredOrders]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const orderCount = filteredOrders.filter((o) => o.status !== "cancelled").length;
  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Revenue chart data (group by day/week/month based on period)
  const revenueChartData = useMemo(() => {
    const grouped: Record<string, { date: string; revenue: number; expenses: number }> = {};
    const useMonth = period === "1y" || period === "all";

    filteredOrders.filter((o) => o.status !== "cancelled").forEach((o) => {
      const d = new Date(o.created_at);
      const key = useMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, expenses: 0 };
      grouped[key].revenue += Number(o.total);
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = useMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : e.date;
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, expenses: 0 };
      grouped[key].expenses += Number(e.amount);
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, filteredExpenses, period]);

  // Expenses by category (pie chart)
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(grouped).map(([category, amount]) => ({
      name: categoryLabels[category]?.label || category,
      value: amount,
      color: categoryLabels[category]?.color || "#94a3b8",
    }));
  }, [filteredExpenses]);

  async function handleAddExpense() {
    if (!expForm.description.trim() || expForm.amount <= 0 || !user) return;
    setSaving(true);
    await supabase.from("expenses").insert({
      category: expForm.category,
      description: expForm.description,
      amount: expForm.amount,
      date: expForm.date,
      recurring: expForm.recurring,
      recurring_period: expForm.recurring ? expForm.recurring_period : null,
      created_by: user.id,
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

  function exportCSV() {
    const rows = [
      ["Tipo", "Data", "Descrição", "Categoria", "Valor"],
      ...filteredOrders.filter((o) => o.status !== "cancelled").map((o) => [
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

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Receitas, despesas e fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "1y", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                period === p ? "bg-primary text-primary-foreground shadow-md" : "bg-supet-bg-alt text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "Tudo" : p}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-supet-bg-alt text-muted-foreground hover:text-primary text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Receita</p>
            <p className="text-lg font-extrabold text-foreground">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-destructive/15 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Despesas</p>
            <p className="text-lg font-extrabold text-foreground">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${profit >= 0 ? "bg-emerald-500/15" : "bg-destructive/15"}`}>
            {profit >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-600" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Lucro</p>
            <p className={`text-lg font-extrabold ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatCurrency(profit)}</p>
          </div>
        </div>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Ticket médio</p>
            <p className="text-lg font-extrabold text-foreground">{formatCurrency(avgTicket)}</p>
          </div>
        </div>
      </div>

      {/* Margin bar */}
      <div className="bg-supet-bg-alt rounded-3xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-foreground">Margem de lucro</p>
          <p className={`text-sm font-extrabold ${margin >= 0 ? "text-emerald-600" : "text-destructive"}`}>{margin.toFixed(1)}%</p>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${margin >= 20 ? "bg-emerald-500" : margin >= 0 ? "bg-amber-500" : "bg-destructive"}`}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue vs Expenses chart */}
        <div className="lg:col-span-2 bg-supet-bg-alt rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Receita vs Despesas</p>
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-border/30 rounded-2xl" />
          ) : revenueChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%, 0.15)" name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%, 0.15)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expenses by category */}
        <div className="bg-supet-bg-alt rounded-3xl p-5">
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
                    {expensesByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
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

      {/* Expenses section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-foreground">Despesas</h2>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Add expense form */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="bg-supet-bg-alt rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
                  <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-supet-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor (R$)</label>
                  <input type="number" min={0} step={0.01} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-2xl bg-supet-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data</label>
                  <input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-supet-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={expForm.recurring} onChange={(e) => setExpForm({ ...expForm, recurring: e.target.checked })} className="rounded" />
                    <span className="text-xs font-semibold text-muted-foreground">Recorrente</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Descrição da despesa..." className="flex-1 px-4 py-2.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
          {[1, 2, 3].map((i) => <div key={i} className="bg-supet-bg-alt rounded-3xl p-5 h-16 animate-pulse" />)}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-supet-bg-alt rounded-3xl p-10 text-center text-muted-foreground text-sm">
          Nenhuma despesa registrada no período.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp, i) => {
            const cat = categoryLabels[exp.category] || categoryLabels.other;
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 p-4 bg-supet-bg-alt rounded-3xl group"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "22" }}>
                  <DollarSign className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{exp.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "22", color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{new Date(exp.date).toLocaleDateString("pt-BR")}</span>
                    {exp.recurring && <span className="text-[10px] text-muted-foreground">🔄 {exp.recurring_period}</span>}
                  </div>
                </div>
                <p className="text-sm font-extrabold text-destructive flex-shrink-0">-{formatCurrency(Number(exp.amount))}</p>
                <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
