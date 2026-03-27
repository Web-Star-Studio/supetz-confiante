import { useMemo } from "react";
import { Percent, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RPieChart, Pie, Cell,
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
  amount: number;
  date: string;
}

interface Props {
  orders: Order[];
  expenses: Expense[];
}

const categoryColors: Record<string, string> = {
  product: "hsl(var(--primary))",
  shipping: "#6366f1",
  marketing: "#f59e0b",
  platform: "#06b6d4",
  salary: "#8b5cf6",
  tax: "#ef4444",
  other: "#94a3b8",
};

const categoryLabels: Record<string, string> = {
  product: "Produto",
  shipping: "Frete",
  marketing: "Marketing",
  platform: "Plataforma",
  salary: "Salários",
  tax: "Impostos",
  other: "Outros",
};

export default function MarginAnalysisTab({ orders, expenses }: Props) {
  const monthlyMargins = useMemo(() => {
    const now = new Date();
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" });

      const rev = activeOrders.filter((o) => o.created_at.startsWith(key)).reduce((s, o) => s + Number(o.total), 0);
      const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + Number(e.amount), 0);
      const cogs = expenses.filter((e) => e.date.startsWith(key) && (e.category === "product" || e.category === "shipping")).reduce((s, e) => s + Number(e.amount), 0);

      const grossMargin = rev > 0 ? ((rev - cogs) / rev) * 100 : 0;
      const netMargin = rev > 0 ? ((rev - exp) / rev) * 100 : 0;

      data.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        revenue: Math.round(rev),
        expenses: Math.round(exp),
        grossMargin: Math.round(grossMargin * 10) / 10,
        netMargin: Math.round(netMargin * 10) / 10,
      });
    }
    return data;
  }, [orders, expenses]);

  // Cost structure analysis
  const costStructure = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const recentExpenses = expenses.filter((e) => new Date(e.date) >= threeMonthsAgo);
    const total = recentExpenses.reduce((s, e) => s + Number(e.amount), 0);

    const byCategory: Record<string, number> = {};
    recentExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });

    return Object.entries(byCategory)
      .map(([category, amount]) => ({
        name: categoryLabels[category] || category,
        value: Math.round(amount * 100) / 100,
        percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        color: categoryColors[category] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Margin evolution (quarter comparison)
  const quarterComparison = useMemo(() => {
    const nonZero = monthlyMargins.filter((m) => m.revenue > 0);
    if (nonZero.length < 4) return null;

    const recent3 = nonZero.slice(-3);
    const prev3 = nonZero.slice(-6, -3);

    const recentGross = recent3.reduce((s, m) => s + m.grossMargin, 0) / recent3.length;
    const recentNet = recent3.reduce((s, m) => s + m.netMargin, 0) / recent3.length;
    const prevGross = prev3.length > 0 ? prev3.reduce((s, m) => s + m.grossMargin, 0) / prev3.length : 0;
    const prevNet = prev3.length > 0 ? prev3.reduce((s, m) => s + m.netMargin, 0) / prev3.length : 0;

    return {
      recentGross, recentNet,
      grossChange: recentGross - prevGross,
      netChange: recentNet - prevNet,
    };
  }, [monthlyMargins]);

  // Biggest cost contributors
  const optimizationOpportunities = useMemo(() => {
    const tips: { text: string; priority: "high" | "medium" | "low" }[] = [];
    const totalCost = costStructure.reduce((s, c) => s + c.value, 0);

    costStructure.forEach((cat) => {
      if (cat.percent > 40) {
        tips.push({ text: `${cat.name} representa ${cat.percent}% dos custos — analise alternativas`, priority: "high" });
      } else if (cat.percent > 25) {
        tips.push({ text: `${cat.name} é ${cat.percent}% dos custos — monitore de perto`, priority: "medium" });
      }
    });

    if (quarterComparison && quarterComparison.netChange < -5) {
      tips.push({ text: `Margem líquida caiu ${Math.abs(quarterComparison.netChange).toFixed(1)}pp no trimestre — investigar`, priority: "high" });
    }

    if (tips.length === 0) {
      tips.push({ text: "Estrutura de custos equilibrada — continue monitorando", priority: "low" });
    }

    return tips;
  }, [costStructure, quarterComparison]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Quarter KPIs */}
      {quarterComparison && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Margem Bruta", value: `${quarterComparison.recentGross.toFixed(1)}%`, change: quarterComparison.grossChange, color: quarterComparison.recentGross >= 30 ? "text-emerald-600" : "text-amber-500" },
            { label: "Margem Líquida", value: `${quarterComparison.recentNet.toFixed(1)}%`, change: quarterComparison.netChange, color: quarterComparison.recentNet >= 10 ? "text-emerald-600" : "text-amber-500" },
            { label: "Maior Custo", value: costStructure[0]?.name || "-", sub: costStructure[0] ? `${costStructure[0].percent}%` : "", color: "text-foreground" },
            { label: "Custos (3m)", value: fmt(costStructure.reduce((s, c) => s + c.value, 0)), color: "text-destructive" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-3xl p-4 text-center">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
              {kpi.change !== undefined && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${kpi.change >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpi.change).toFixed(1)}pp vs trimestre ant.
                </span>
              )}
              {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Margin evolution chart */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Evolução das Margens (12 meses)</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyMargins} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
              formatter={(v: number, name: string) => [name.includes("Margem") ? `${v}%` : fmt(v), name]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Bar yAxisId="left" dataKey="revenue" name="Receita" fill="hsl(142, 71%, 45%, 0.3)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="expenses" name="Despesas" fill="hsl(0, 84%, 60%, 0.3)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="grossMargin" name="Margem Bruta" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="netMargin" name="Margem Líquida" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost structure pie */}
        <div className="bg-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Estrutura de Custos (3 meses)</p>
          </div>
          {costStructure.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem despesas</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RPieChart>
                  <Pie data={costStructure} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {costStructure.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                </RPieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {costStructure.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">{fmt(cat.value)}</span>
                      <span className="text-muted-foreground w-10 text-right">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Optimization opportunities */}
        <div className="bg-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Oportunidades de Otimização</p>
          </div>
          <div className="space-y-3">
            {optimizationOpportunities.map((tip, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-2xl ${
                tip.priority === "high" ? "bg-destructive/10" : tip.priority === "medium" ? "bg-amber-500/10" : "bg-emerald-500/10"
              }`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  tip.priority === "high" ? "bg-destructive" : tip.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <p className="text-xs text-foreground">{tip.text}</p>
              </div>
            ))}
          </div>

          {/* Cost waterfall summary */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Composição do Custo por Real de Receita</p>
            {costStructure.length > 0 && (
              <div className="w-full h-4 rounded-full overflow-hidden flex">
                {costStructure.map((cat) => (
                  <div
                    key={cat.name}
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    className="h-full transition-all"
                    title={`${cat.name}: ${cat.percent}%`}
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {costStructure.slice(0, 4).map((cat) => (
                <span key={cat.name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + "22", color: cat.color }}>
                  {cat.name}: {cat.percent}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
