import { useMemo, useState } from "react";
import { Rocket, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine,
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
  recurring: boolean;
}

interface Props {
  orders: Order[];
  expenses: Expense[];
}

type Scenario = "pessimist" | "base" | "optimist";

const scenarioConfig: Record<Scenario, { label: string; growth: number; color: string }> = {
  pessimist: { label: "Pessimista", growth: -0.05, color: "#ef4444" },
  base: { label: "Base", growth: 0.02, color: "hsl(var(--primary))" },
  optimist: { label: "Otimista", growth: 0.08, color: "#22c55e" },
};

export default function ProjectionsTab({ orders, expenses }: Props) {
  const [months, setMonths] = useState(6);

  const projectionData = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const now = new Date();

    // Gather last 6 months of real data
    const realMonths: { key: string; label: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const rev = activeOrders.filter((o) => o.created_at.startsWith(key)).reduce((s, o) => s + Number(o.total), 0);
      const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + Number(e.amount), 0);
      realMonths.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), revenue: rev, expenses: exp });
    }

    // Calculate averages from non-zero months
    const nonZero = realMonths.filter((m) => m.revenue > 0);
    const avgRevenue = nonZero.length > 0 ? nonZero.reduce((s, m) => s + m.revenue, 0) / nonZero.length : 0;
    const avgExpenses = nonZero.length > 0 ? nonZero.reduce((s, m) => s + m.expenses, 0) / nonZero.length : 0;
    const recurringCost = expenses.filter((e) => e.recurring).reduce((s, e) => s + Number(e.amount), 0);

    // Revenue growth trend (linear regression simplified)
    const recentRevenues = realMonths.slice(-3).map((m) => m.revenue);
    const trend = recentRevenues.length >= 2
      ? (recentRevenues[recentRevenues.length - 1] - recentRevenues[0]) / (recentRevenues.length - 1) / (avgRevenue || 1)
      : 0;

    // Build chart data
    const data: any[] = realMonths.map((m) => ({
      label: m.label,
      real: Math.round(m.revenue),
      realExp: Math.round(m.expenses),
      realProfit: Math.round(m.revenue - m.expenses),
    }));

    // Project future months for each scenario
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const entry: any = { label: label.charAt(0).toUpperCase() + label.slice(1) };

      for (const [key, cfg] of Object.entries(scenarioConfig)) {
        const growth = 1 + cfg.growth * i + trend * i * 0.5;
        const projRev = Math.round(avgRevenue * Math.max(0, growth));
        const projExp = Math.round(recurringCost + (avgExpenses - recurringCost) * (1 + cfg.growth * 0.3 * i));
        entry[`${key}Rev`] = projRev;
        entry[`${key}Profit`] = projRev - projExp;
      }
      data.push(entry);
    }

    return { data, avgRevenue, avgExpenses, trend, recurringCost };
  }, [orders, expenses, months]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  // Breakeven analysis
  const breakeven = useMemo(() => {
    const { recurringCost, avgExpenses } = projectionData;
    const fixedCosts = recurringCost;
    const variableRatio = projectionData.avgRevenue > 0
      ? (avgExpenses - recurringCost) / projectionData.avgRevenue
      : 0.5;
    const breakevenRevenue = variableRatio < 1 ? fixedCosts / (1 - variableRatio) : 0;
    return { fixedCosts, variableRatio, breakevenRevenue };
  }, [projectionData]);

  // Projected totals for each scenario
  const scenarioTotals = useMemo(() => {
    const result: Record<Scenario, { revenue: number; profit: number }> = {
      pessimist: { revenue: 0, profit: 0 },
      base: { revenue: 0, profit: 0 },
      optimist: { revenue: 0, profit: 0 },
    };
    projectionData.data.forEach((d: any) => {
      for (const key of Object.keys(scenarioConfig) as Scenario[]) {
        if (d[`${key}Rev`] !== undefined) {
          result[key].revenue += d[`${key}Rev`];
          result[key].profit += d[`${key}Profit`];
        }
      }
    });
    return result;
  }, [projectionData]);

  return (
    <div className="space-y-6">
      {/* Projection Chart */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Projeção de Receita por Cenário</p>
          </div>
          <div className="flex items-center gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  months === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m} meses
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Dados reais (6 meses) + projeção ({months} meses) com 3 cenários de crescimento.
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {Object.entries(scenarioConfig).map(([key, cfg]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cfg.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
              formatter={(v: number, name: string) => [fmt(v), name]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            {breakeven.breakevenRevenue > 0 && (
              <ReferenceLine y={breakeven.breakevenRevenue} stroke="#f59e0b" strokeDasharray="8 4" label={{ value: "Breakeven", fontSize: 10, fill: "#f59e0b" }} />
            )}
            <Area type="monotone" dataKey="real" name="Real" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad-base)" dot={{ r: 2 }} />
            <Area type="monotone" dataKey="optimistRev" name="Otimista" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#grad-optimist)" dot={false} />
            <Area type="monotone" dataKey="baseRev" name="Base" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="5 5" fill="none" dot={false} />
            <Area type="monotone" dataKey="pessimistRev" name="Pessimista" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#grad-pessimist)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(scenarioConfig) as [Scenario, typeof scenarioConfig[Scenario]][]).map(([key, cfg]) => (
          <div key={key} className="bg-card rounded-3xl p-4 text-center border border-border/50">
            <p className="text-xs font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="text-lg font-extrabold text-foreground">{fmt(scenarioTotals[key].revenue)}</p>
            <p className="text-[10px] text-muted-foreground">Receita projetada ({months}m)</p>
            <div className="mt-2 pt-2 border-t border-border/30">
              <p className={`text-sm font-bold ${scenarioTotals[key].profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {fmt(scenarioTotals[key].profit)}
              </p>
              <p className="text-[10px] text-muted-foreground">Lucro projetado</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakeven + Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-foreground">Ponto de Equilíbrio (Breakeven)</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Custos fixos mensais</span>
              <span className="font-bold text-foreground">{fmt(breakeven.fixedCosts)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Proporção custos variáveis</span>
              <span className="font-bold text-foreground">{(breakeven.variableRatio * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-border/30">
              <span className="text-muted-foreground font-semibold">Receita mínima / mês</span>
              <span className="font-extrabold text-amber-600">{fmt(breakeven.breakevenRevenue)}</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-muted/30 rounded-xl">
            <p className="text-[11px] text-muted-foreground">
              {projectionData.avgRevenue > breakeven.breakevenRevenue
                ? `✅ Receita média (${fmt(projectionData.avgRevenue)}) está acima do breakeven.`
                : `⚠️ Receita média (${fmt(projectionData.avgRevenue)}) está abaixo do breakeven. Ação necessária.`}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Insights Preditivos</p>
          </div>
          <div className="space-y-2.5">
            {[
              projectionData.trend > 0.05
                ? { icon: TrendingUp, color: "text-emerald-600", text: `Tendência de alta: receita crescendo ~${(projectionData.trend * 100).toFixed(0)}% ao mês` }
                : projectionData.trend < -0.05
                  ? { icon: AlertTriangle, color: "text-destructive", text: `Tendência de queda: receita recuando ~${Math.abs(projectionData.trend * 100).toFixed(0)}% ao mês` }
                  : { icon: TrendingUp, color: "text-amber-500", text: "Receita estável — considere ações de crescimento" },
              breakeven.variableRatio > 0.6
                ? { icon: AlertTriangle, color: "text-amber-500", text: `Custos variáveis altos (${(breakeven.variableRatio * 100).toFixed(0)}%) — negocie com fornecedores` }
                : { icon: Lightbulb, color: "text-emerald-600", text: "Estrutura de custos saudável" },
              projectionData.recurringCost > projectionData.avgRevenue * 0.5
                ? { icon: AlertTriangle, color: "text-destructive", text: "Custos fixos consomem >50% da receita média" }
                : { icon: Lightbulb, color: "text-primary", text: "Custos fixos dentro de parâmetros saudáveis" },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <insight.icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${insight.color}`} />
                <p className="text-xs text-muted-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
