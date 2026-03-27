import { useMemo, useState } from "react";
import { type EnrichedClient } from "./CRMClientList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, MessageSquare, UserX, TrendingUp, Cake, Send, Gift } from "lucide-react";

interface Props {
  clients: EnrichedClient[];
  orders: { user_id: string; total: number; created_at: string }[];
  pets: { user_id: string; name: string; birth_date: string | null }[];
  reviews: { user_id: string; created_at: string }[];
}

interface Opportunity {
  type: "dormant" | "post_purchase" | "reactivation" | "upsell" | "pet_birthday";
  client: EnrichedClient;
  detail: string;
  icon: typeof ShoppingCart;
  color: string;
}

export default function CRMFollowUpTab({ clients, orders, pets, reviews }: Props) {
  const [sending, setSending] = useState<string | null>(null);
  const [inactivityDays, setInactivityDays] = useState(30);

  const opportunities = useMemo(() => {
    const now = Date.now();
    const results: Opportunity[] = [];
    const realClients = clients.filter((c) => c.user_id);

    for (const client of realClients) {
      const clientOrders = orders.filter((o) => o.user_id === client.user_id);
      const sortedOrders = [...clientOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const lastOrder = sortedOrders[0];
      const daysSinceOrder = lastOrder ? (now - new Date(lastOrder.created_at).getTime()) / 86400000 : Infinity;

      // Dormant: has orders but hasn't bought in X days
      if (clientOrders.length > 0 && daysSinceOrder > inactivityDays && daysSinceOrder < 365) {
        results.push({
          type: "dormant",
          client,
          detail: `Sem compras há ${Math.round(daysSinceOrder)} dias`,
          icon: ShoppingCart,
          color: "#f97316",
        });
      }

      // Post-purchase: bought in last 7 days, no review
      if (lastOrder && daysSinceOrder <= 7) {
        const hasRecentReview = reviews.some(
          (r) => r.user_id === client.user_id && new Date(r.created_at).getTime() > new Date(lastOrder.created_at).getTime()
        );
        if (!hasRecentReview) {
          results.push({
            type: "post_purchase",
            client,
            detail: `Comprou há ${Math.round(daysSinceOrder)} dia(s), sem review`,
            icon: MessageSquare,
            color: "#10b981",
          });
        }
      }

      // Reactivation: inactive 60+ days with purchase history
      if (clientOrders.length >= 2 && daysSinceOrder > 60) {
        results.push({
          type: "reactivation",
          client,
          detail: `Inativo há ${Math.round(daysSinceOrder)} dias, ${clientOrders.length} pedidos anteriores`,
          icon: UserX,
          color: "#ef4444",
        });
      }

      // Upsell: single high-value order
      if (clientOrders.length === 1 && client.totalSpent >= 150) {
        results.push({
          type: "upsell",
          client,
          detail: `1 pedido de R$ ${client.totalSpent.toFixed(2)} — potencial de upsell`,
          icon: TrendingUp,
          color: "#8b5cf6",
        });
      }

      // Pet birthday
      const clientPets = pets.filter((p) => p.user_id === client.user_id && p.birth_date);
      for (const pet of clientPets) {
        const birth = new Date(pet.birth_date!);
        const thisYear = new Date(birth);
        thisYear.setFullYear(new Date().getFullYear());
        const daysUntil = (thisYear.getTime() - now) / 86400000;
        if (daysUntil >= 0 && daysUntil <= 7) {
          results.push({
            type: "pet_birthday",
            client,
            detail: `Aniversário de ${pet.name} em ${Math.round(daysUntil)} dia(s)`,
            icon: Cake,
            color: "#ec4899",
          });
        }
      }
    }

    return results;
  }, [clients, orders, pets, reviews, inactivityDays]);

  const grouped = useMemo(() => {
    const groups: Record<string, Opportunity[]> = {
      post_purchase: [],
      dormant: [],
      reactivation: [],
      upsell: [],
      pet_birthday: [],
    };
    opportunities.forEach((o) => groups[o.type]?.push(o));
    return groups;
  }, [opportunities]);

  const labels: Record<string, string> = {
    post_purchase: "Pós-compra (sem review)",
    dormant: "Clientes dormentes",
    reactivation: "Reativação",
    upsell: "Oportunidade de Upsell",
    pet_birthday: "Aniversário do Pet",
  };

  async function sendNotification(client: EnrichedClient, title: string, message: string) {
    if (!client.user_id) return;
    setSending(client.id);
    try {
      await supabase.from("user_notifications").insert({
        user_id: client.user_id,
        title,
        message,
        type: "promo",
      });
      toast.success(`Notificação enviada para ${client.full_name || "cliente"}`);
    } catch {
      toast.error("Erro ao enviar notificação");
    }
    setSending(null);
  }

  async function sendCoupon(client: EnrichedClient) {
    if (!client.user_id) return;
    setSending(client.id + "_coupon");
    try {
      const code = `VOLTE${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await supabase.from("user_coupons").insert({
        user_id: client.user_id,
        code,
        discount_type: "percentage",
        discount_value: 10,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      await supabase.from("user_notifications").insert({
        user_id: client.user_id,
        title: "🎁 Cupom especial para você!",
        message: `Use o código ${code} e ganhe 10% de desconto. Válido por 7 dias!`,
        type: "promo",
      });
      toast.success(`Cupom ${code} enviado para ${client.full_name || "cliente"}`);
    } catch {
      toast.error("Erro ao enviar cupom");
    }
    setSending(null);
  }

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Dias de inatividade para "dormentes":</label>
        <input
          type="number"
          value={inactivityDays}
          onChange={(e) => setInactivityDays(Number(e.target.value) || 30)}
          min={7}
          max={365}
          className="w-20 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-muted-foreground">Total de oportunidades: <strong>{opportunities.length}</strong></span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(grouped).map(([type, items]) => {
          const label = labels[type];
          const sample = items[0];
          const Icon = sample?.icon || ShoppingCart;
          const color = sample?.color || "#64748b";
          return (
            <div key={type} className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{label}</span>
              </div>
              <p className="text-xl font-extrabold text-foreground">{items.length}</p>
            </div>
          );
        })}
      </div>

      {/* Lists */}
      {Object.entries(grouped).map(([type, items]) => {
        if (items.length === 0) return null;
        const label = labels[type];
        return (
          <div key={type} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
              {(() => { const Icon = items[0].icon; return <Icon className="w-4 h-4" style={{ color: items[0].color }} />; })()}
              <h3 className="text-sm font-bold text-foreground">{label}</h3>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} oportunidade{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {items.slice(0, 20).map((opp, i) => (
                <div key={`${opp.client.id}-${i}`} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{opp.client.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{opp.detail}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={sending === opp.client.id}
                      onClick={() => {
                        const msgs: Record<string, [string, string]> = {
                          dormant: ["Sentimos sua falta! 🐾", "Faz tempo que você não nos visita. Confira as novidades!"],
                          post_purchase: ["Como está seu pet? 🐶", "Gostaríamos de saber se está gostando! Deixe uma avaliação."],
                          reactivation: ["Queremos você de volta! 💚", "Temos novidades especiais esperando por você."],
                          upsell: ["Oferta exclusiva! ⭐", "Baseado na sua última compra, preparamos algo especial."],
                          pet_birthday: ["Feliz aniversário! 🎂", `Parabéns pelo aniversário do seu pet!`],
                        };
                        const [title, msg] = msgs[opp.type] || ["Olá!", "Temos novidades para você."];
                        sendNotification(opp.client, title, msg);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" /> Notificar
                    </button>
                    {(opp.type === "dormant" || opp.type === "reactivation") && (
                      <button
                        disabled={sending === opp.client.id + "_coupon"}
                        onClick={() => sendCoupon(opp.client)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-all disabled:opacity-50"
                      >
                        <Gift className="w-3 h-3" /> Cupom
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {opportunities.length === 0 && (
        <div className="bg-card rounded-2xl p-12 border border-border/50 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma oportunidade de follow-up detectada no momento.</p>
        </div>
      )}
    </div>
  );
}
