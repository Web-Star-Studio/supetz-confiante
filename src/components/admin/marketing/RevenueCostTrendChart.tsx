import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

interface MonthData {
  month: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
}

export default function RevenueCostTrendChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch last 6 months of orders and expenses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoff = sixMonthsAgo.toISOString();

      const [ordersRes, expensesRes, recipientsRes] = await Promise.all([
        supabase.from("orders").select("id, total, created_at, user_id").gte("created_at", cutoff),
        supabase.from("expenses").select("amount, date, category").gte("date", cutoff.split("T")[0]),
        supabase.from("campaign_recipients").select("user_id, sent_at").gte("sent_at", cutoff),
      ]);

      const orders = ordersRes.data || [];
      const expenses = expensesRes.data || [];
      const recipients = recipientsRes.data || [];

      // Build set of users who received campaigns per month
      const campaignUsersByMonth = new Map<string, Set<string>>();
      recipients.forEach((r: any) => {
        if (!r.sent_at) return;
        const m = r.sent_at.slice(0, 7);
        if (!campaignUsersByMonth.has(m)) campaignUsersByMonth.set(m, new Set());
        campaignUsersByMonth.get(m)!.add(r.user_id);
      });

      // Group orders by month, attributing revenue to campaigns if user was a recipient that month
      const revenueByMonth = new Map<string, number>();
      const totalRevenueByMonth = new Map<string, number>();
      orders.forEach((o: any) => {
        const m = o.created_at.slice(0, 7);
        totalRevenueByMonth.set(m, (totalRevenueByMonth.get(m) || 0) + Number(o.total));
        if (campaignUsersByMonth.get(m)?.has(o.user_id)) {
          revenueByMonth.set(m, (revenueByMonth.get(m) || 0) + Number(o.total));
        }
      });

      // Group marketing expenses by month
      const costByMonth = new Map<string, number>();
      expenses.forEach((e: any) => {
        if (e.category === "marketing" || e.category === "advertising") {
          const m = e.date.slice(0, 7);
          costByMonth.set(m, (costByMonth.get(m) || 0) + Number(e.amount));
        }
      });

      // Build 6 months of data
      const months: MonthData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        const revenue = revenueByMonth.get(key) || 0;
        const cost = costByMonth.get(key) || 0;
        months.push({
          month: key,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          revenue: Math.round(revenue * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          profit: Math.round((revenue - cost) * 100) / 100,
        });
      }

      setData(months);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-3xl p-6 flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-bold text-foreground">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const hasData = data.some((d) => d.revenue > 0 || d.cost > 0);

  return (
    <div className="bg-card rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Receita de Campanhas vs Custo Operacional</p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
          Últimos 6 meses
        </span>
      </div>

      {!hasData ? (
        <div className="text-center py-10">
          <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhum dado disponível. Envie campanhas e registre despesas de marketing para ver a tendência.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-cost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Receita campanhas"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#grad-revenue)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              name="Custo marketing"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#grad-cost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {hasData && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/50">
          {[
            { label: "Receita total", value: data.reduce((s, d) => s + d.revenue, 0), color: "text-primary" },
            { label: "Custo total", value: data.reduce((s, d) => s + d.cost, 0), color: "text-destructive" },
            { label: "Resultado", value: data.reduce((s, d) => s + d.profit, 0), color: "" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className={`text-lg font-extrabold ${m.color || (data.reduce((s, d) => s + d.profit, 0) >= 0 ? "text-emerald-600" : "text-destructive")}`}>
                {formatCurrency(m.value)}
              </p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
