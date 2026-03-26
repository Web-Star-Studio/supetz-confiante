import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type MinimalFeedback = {
  rating: string;
  created_at: string;
};

type Props = {
  feedbacks: MinimalFeedback[];
};

export default function FeedbackTrendChart({ feedbacks }: Props) {
  const chartData = useMemo(() => {
    if (!feedbacks.length) return [];

    const days = feedbacks.length > 60 ? 90 : 30;
    const useWeekly = days > 60;
    const start = subDays(new Date(), days);

    if (useWeekly) {
      const weeks = eachWeekOfInterval({ start, end: new Date() }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const inWeek = feedbacks.filter((f) => {
          const d = new Date(f.created_at);
          return d >= weekStart && d <= wEnd;
        });
        const pos = inWeek.filter((f) => f.rating === "positive").length;
        const neg = inWeek.filter((f) => f.rating === "negative").length;
        const total = pos + neg;
        return {
          label: format(weekStart, "dd/MM", { locale: ptBR }),
          positivos: pos,
          negativos: neg,
          satisfacao: total > 0 ? Math.round((pos / total) * 100) : 0,
        };
      });
    }

    const interval = eachDayOfInterval({ start, end: new Date() });
    return interval.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const inDay = feedbacks.filter((f) => f.created_at?.startsWith(dayStr));
      const pos = inDay.filter((f) => f.rating === "positive").length;
      const neg = inDay.filter((f) => f.rating === "negative").length;
      const total = pos + neg;
      return {
        label: format(day, "dd/MM", { locale: ptBR }),
        positivos: pos,
        negativos: neg,
        satisfacao: total > 0 ? Math.round((pos / total) * 100) : 0,
      };
    });
  }, [feedbacks]);

  if (!chartData.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
        Sem dados suficientes para gráfico
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Volume chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Volume de Feedbacks</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="positivos"
                name="Positivos"
                stackId="1"
                stroke="hsl(142, 71%, 45%)"
                fill="hsl(142, 71%, 45%)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="negativos"
                name="Negativos"
                stackId="1"
                stroke="hsl(0, 84%, 60%)"
                fill="hsl(0, 84%, 60%)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Satisfaction rate chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Taxa de Satisfação (%)</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} className="fill-muted-foreground" />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Satisfação"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="satisfacao"
                name="Satisfação"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
