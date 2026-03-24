import { motion } from "framer-motion";
import { ShoppingBag, Crown, ChevronRight } from "lucide-react";

export interface EnrichedClient {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  orderCount: number;
  totalSpent: number;
  totalPoints: number;
  lastOrderDate: string | null;
  status: string;
  tags: { id: string; name: string; color: string }[];
}

interface Props {
  clients: EnrichedClient[];
  loading: boolean;
  onSelect: (client: EnrichedClient) => void;
}

function ClientsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-border" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded-full bg-border" />
            <div className="h-3 w-20 rounded-full bg-border" />
          </div>
          <div className="h-4 w-16 rounded-full bg-border" />
        </div>
      ))}
    </div>
  );
}

const statusLabels: Record<string, { label: string; class: string }> = {
  lead: { label: "Lead", class: "bg-blue-500/15 text-blue-700" },
  active: { label: "Ativo", class: "bg-emerald-500/15 text-emerald-700" },
  inactive: { label: "Inativo", class: "bg-amber-500/15 text-amber-700" },
  vip: { label: "VIP", class: "bg-violet-500/15 text-violet-700" },
};

export default function CRMClientList({ clients, loading, onSelect }: Props) {
  if (loading) return <ClientsSkeleton />;

  if (clients.length === 0) {
    return (
      <div className="bg-supet-bg-alt rounded-3xl p-10 text-center text-muted-foreground text-sm">
        Nenhum cliente encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client, i) => {
        const initials = client.full_name
          ? client.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
          : "?";
        const st = statusLabels[client.status] || statusLabels.lead;
        return (
          <motion.button
            key={client.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onSelect(client)}
            className="w-full flex items-center gap-4 p-4 bg-supet-bg-alt rounded-3xl hover:shadow-md hover:bg-primary/5 transition-all text-left group"
          >
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">{client.full_name || "Sem nome"}</p>
                {client.status === "vip" && <Crown className="w-3.5 h-3.5 text-violet-500" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
                {client.tags.slice(0, 3).map((tag) => (
                  <span key={tag.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
                {client.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{client.tags.length - 3}</span>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> {client.orderCount}
              </span>
              <span className="font-semibold text-foreground">R$ {client.totalSpent.toFixed(2)}</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
}
