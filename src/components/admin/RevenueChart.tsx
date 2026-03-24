import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";

type Period = "7d" | "1m" | "3m" | "6m" | "1y";

const periodLabels: Record<Period, string> = {
  "7d": "7 dias",
  "1m": "1 mês",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 ano",
};

interface ChartData {
  day: string;
  revenue: number;
  orders: number;
  date: string; // ISO date for filtering
}

interface Props {
  data: ChartData[];
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export default function RevenueChart({ data, period, onPeriodChange }: Props) {
  const totalRevenue = useMemo(() => data.reduce((s, d) => s + d.revenue, 0), [data]);
  const totalOrders = useMemo(() => data.reduce((s, d) => s + d.orders, 0), [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <div className="bg-muted/50 rounded-3xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display">Receita</h3>
            <p className="text-2xl font-black text-foreground mt-0.5">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex rounded-full bg-background p-0.5 border border-border/50">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all ${
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(27 100% 49%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(27 100% 49%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12, boxShadow: "0 8px 24px -8px rgba(55,35,10,0.15)" }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(27 100% 49%)" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-muted/50 rounded-3xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display">Pedidos</h3>
            <p className="text-2xl font-black text-foreground mt-0.5">{totalOrders}</p>
          </div>
          <div className="flex rounded-full bg-background p-0.5 border border-border/50">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all ${
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12, boxShadow: "0 8px 24px -8px rgba(55,35,10,0.15)" }}
                formatter={(value: number) => [value, "Pedidos"]}
              />
              <Bar dataKey="orders" fill="hsl(27 100% 49%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
