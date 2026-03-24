import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

type Period = "7d" | "1m" | "3m" | "6m" | "1y";

const periodLabels: Record<Period, string> = {
  "7d": "7d",
  "1m": "1m",
  "3m": "3m",
  "6m": "6m",
  "1y": "1a",
};

interface ChartData {
  day: string;
  revenue: number;
  orders: number;
  date: string;
}

interface Props {
  data: ChartData[];
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const tooltipStyle = {
  background: "hsl(30 33% 95%)",
  border: "1px solid hsl(28 20% 85%)",
  borderRadius: 14,
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 8px 32px -8px rgba(55,35,10,0.12)",
};

const tickStyle = { fontSize: 10, fill: "hsl(25 10% 55%)" };

function PeriodPills({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-xl bg-muted/80 p-0.5 gap-0.5">
      {(Object.keys(periodLabels) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
            period === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}

export default function RevenueChart({ data, period, onPeriodChange }: Props) {
  const totalRevenue = useMemo(() => data.reduce((s, d) => s + d.revenue, 0), [data]);
  const totalOrders = useMemo(() => data.reduce((s, d) => s + d.orders, 0), [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Receita</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <PeriodPills period={period} onChange={onPeriodChange} />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(27 100% 49%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(27 100% 49%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(27 100% 49%)" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pedidos</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalOrders}</p>
          </div>
          <PeriodPills period={period} onChange={onPeriodChange} />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [value, "Pedidos"]}
              />
              <Bar dataKey="orders" fill="hsl(27 100% 49%)" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
