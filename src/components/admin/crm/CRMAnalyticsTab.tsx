import { useMemo } from "react";
import { type EnrichedClient } from "./CRMClientList";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Repeat, DollarSign, TrendingDown } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  clients: EnrichedClient[];
  orders: { user_id: string; total: number; created_at: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  lead: "#64748b",
  active: "#10b981",
  inactive: "#ef4444",
  vip: "#f59e0b",
  newsletter_lead: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  active: "Ativo",
  inactive: "Inativo",
  vip: "VIP",
  newsletter_lead: "Lead Newsletter",
};

export default function CRMAnalyticsTab({ clients, orders }: Props) {
  // Growth by month (last 6 months)
  const growthData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = clients.filter((c) =>
        isWithinInterval(new Date(c.created_at), { start, end })
      ).length;
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        count,
      });
    }
    return months;
  }, [clients]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || "#64748b",
    }));
  }, [clients]);

  // KPIs
  const kpis = useMemo(() => {
    const realClients = clients.filter((c) => c.user_id);
    const withOrders = realClients.filter((c) => c.orderCount > 0);
    const repeaters = realClients.filter((c) => c.orderCount >= 2);
    const totalRevenue = withOrders.reduce((s, c) => s + c.totalSpent, 0);

    const ltv = withOrders.length > 0 ? totalRevenue / withOrders.length : 0;
    const retention = withOrders.length > 0 ? (repeaters.length / withOrders.length) * 100 : 0;

    // Churn: clients who bought but not in last 90 days
    const now = Date.now();
    const churned = withOrders.filter((c) => {
      if (!c.lastOrderDate) return true;
      return (now - new Date(c.lastOrderDate).getTime()) / 86400000 > 90;
    });
    const churnRate = withOrders.length > 0 ? (churned.length / withOrders.length) * 100 : 0;

    return { ltv, retention, churnRate, totalClients: clients.length, withOrders: withOrders.length, repeaters: repeaters.length };
  }, [clients]);

  // Average ticket by order count bracket
  const ticketData = useMemo(() => {
    const brackets = [
      { label: "1 pedido", min: 1, max: 1 },
      { label: "2-3 pedidos", min: 2, max: 3 },
      { label: "4-5 pedidos", min: 4, max: 5 },
      { label: "6+ pedidos", min: 6, max: 999 },
    ];
    return brackets.map((b) => {
      const group = clients.filter((c) => c.orderCount >= b.min && c.orderCount <= b.max);
      const avg = group.length > 0 ? group.reduce((s, c) => s + c.totalSpent, 0) / group.length : 0;
      return { name: b.label, ticket: Math.round(avg) };
    });
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">LTV Médio</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">R$ {kpis.ltv.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Retenção</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{kpis.retention.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">{kpis.repeaters} de {kpis.withOrders} compradores</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Churn Rate</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{kpis.churnRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Inativos há 90+ dias</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Base Total</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{kpis.totalClients}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth chart */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-4">Novos Clientes por Mês</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" name="Novos clientes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-4">Distribuição por Status</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ticket by frequency */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-4">Ticket Médio por Frequência de Compra</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => `R$ ${v}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="ticket" name="Ticket Médio" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
