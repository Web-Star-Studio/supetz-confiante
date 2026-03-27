import { useMemo } from "react";
import { type EnrichedClient } from "./CRMClientList";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Diamond, Flame, Snowflake, Star, TrendingUp } from "lucide-react";

interface Props {
  clients: EnrichedClient[];
  orders: { user_id: string; total: number; created_at: string }[];
  pets: { user_id: string }[];
  loyaltyPoints: { user_id: string; points: number }[];
}

export interface ScoredClient extends EnrichedClient {
  score: number;
  tier: string;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  engagementScore: number;
}

const TIERS = [
  { name: "Diamante", min: 81, max: 100, color: "#8b5cf6", icon: Diamond },
  { name: "Premium", min: 61, max: 80, color: "#f59e0b", icon: Star },
  { name: "Quente", min: 41, max: 60, color: "#ef4444", icon: Flame },
  { name: "Morno", min: 21, max: 40, color: "#f97316", icon: TrendingUp },
  { name: "Frio", min: 0, max: 20, color: "#64748b", icon: Snowflake },
];

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min && score <= t.max) || TIERS[4];
}

function calcScore(
  client: EnrichedClient,
  allOrders: Props["orders"],
  allPets: Props["pets"],
  allPoints: Props["loyaltyPoints"],
  maxSpent: number,
  maxOrders: number,
  maxPoints: number
): ScoredClient {
  const now = Date.now();

  // Recency (25pts) - days since last order, lower is better
  let recencyScore = 0;
  if (client.lastOrderDate) {
    const daysSince = (now - new Date(client.lastOrderDate).getTime()) / 86400000;
    if (daysSince <= 7) recencyScore = 25;
    else if (daysSince <= 30) recencyScore = 20;
    else if (daysSince <= 60) recencyScore = 15;
    else if (daysSince <= 90) recencyScore = 10;
    else if (daysSince <= 180) recencyScore = 5;
  }

  // Frequency (25pts)
  const frequencyScore = maxOrders > 0 ? Math.round((client.orderCount / maxOrders) * 25) : 0;

  // Monetary (25pts)
  const monetaryScore = maxSpent > 0 ? Math.round((client.totalSpent / maxSpent) * 25) : 0;

  // Engagement (25pts) - pets + points
  const userPets = allPets.filter((p) => p.user_id === client.user_id).length;
  const userPoints = allPoints.filter((p) => p.user_id === client.user_id).reduce((s, p) => s + p.points, 0);
  const petScore = Math.min(userPets * 5, 10);
  const pointScore = maxPoints > 0 ? Math.round((userPoints / maxPoints) * 15) : 0;
  const engagementScore = Math.min(petScore + pointScore, 25);

  const score = Math.min(recencyScore + frequencyScore + monetaryScore + engagementScore, 100);

  return {
    ...client,
    score,
    tier: getTier(score).name,
    recencyScore,
    frequencyScore,
    monetaryScore,
    engagementScore,
  };
}

export default function CRMScoringTab({ clients, orders, pets, loyaltyPoints }: Props) {
  const scoredClients = useMemo(() => {
    const realClients = clients.filter((c) => c.user_id);
    const maxSpent = Math.max(...realClients.map((c) => c.totalSpent), 1);
    const maxOrders = Math.max(...realClients.map((c) => c.orderCount), 1);
    const maxPoints = Math.max(...loyaltyPoints.map((p) => p.points), 1);

    return realClients
      .map((c) => calcScore(c, orders, pets, loyaltyPoints, maxSpent, maxOrders, maxPoints))
      .sort((a, b) => b.score - a.score);
  }, [clients, orders, pets, loyaltyPoints]);

  const distribution = useMemo(() => {
    return TIERS.map((tier) => ({
      name: tier.name,
      count: scoredClients.filter((c) => c.score >= tier.min && c.score <= tier.max).length,
      color: tier.color,
    })).reverse();
  }, [scoredClients]);

  const avgScore = scoredClients.length > 0
    ? Math.round(scoredClients.reduce((s, c) => s + c.score, 0) / scoredClients.length)
    : 0;

  const top10 = scoredClients.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const count = scoredClients.filter((c) => c.score >= tier.min && c.score <= tier.max).length;
          const Icon = tier.icon;
          return (
            <div key={tier.name} className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: tier.color }} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tier.name}</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">{tier.min}-{tier.max} pts</p>
            </div>
          );
        })}
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Score Médio</p>
          <p className="text-2xl font-extrabold text-foreground">{avgScore}</p>
          <p className="text-xs text-muted-foreground">de 100 pontos</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-4">Distribuição por Faixa</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="count" name="Clientes" radius={[8, 8, 0, 0]}>
                {distribution.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-bold text-foreground">Top 10 Clientes por Score</h3>
        </div>
        <div className="divide-y divide-border/30">
          {top10.map((client, i) => {
            const tier = getTier(client.score);
            const Icon = tier.icon;
            return (
              <div key={client.id} className="px-6 py-3 flex items-center gap-4">
                <span className="text-lg font-extrabold text-muted-foreground w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{client.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.orderCount} pedido{client.orderCount !== 1 ? "s" : ""} · R$ {client.totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: tier.color }} />
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: tier.color + "22", color: tier.color }}>
                    {client.score} pts
                  </span>
                </div>
                <div className="hidden md:flex gap-1 text-[10px] text-muted-foreground">
                  <span title="Recência">R:{client.recencyScore}</span>
                  <span title="Frequência">F:{client.frequencyScore}</span>
                  <span title="Monetário">M:{client.monetaryScore}</span>
                  <span title="Engajamento">E:{client.engagementScore}</span>
                </div>
              </div>
            );
          })}
          {top10.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum cliente com dados suficientes para scoring.</p>
          )}
        </div>
      </div>
    </div>
  );
}
