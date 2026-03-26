import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Crown, ChevronRight, ArrowUpDown, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react";

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

type SortKey = "name" | "orders" | "spent" | "date";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

function ClientsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
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
  newsletter_lead: { label: "Lead (Newsletter)", class: "bg-sky-500/15 text-sky-700" },
};

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "orders", label: "Pedidos" },
  { key: "spent", label: "Gasto total" },
  { key: "date", label: "Cadastro" },
];

export default function CRMClientList({ clients, loading, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...clients];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.full_name || "").localeCompare(b.full_name || "");
          break;
        case "orders":
          cmp = a.orderCount - b.orderCount;
          break;
        case "spent":
          cmp = a.totalSpent - b.totalSpent;
          break;
        case "date":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [clients, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset page when clients change
  useMemo(() => setPage(0), [clients.length]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  if (loading) return <ClientsSkeleton />;

  if (clients.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Nenhum cliente encontrado.
      </div>
    );
  }

  return (
    <div>
      {/* Sort bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mr-1">Ordenar:</span>
        {sortOptions.map((opt) => {
          const isActive = sortKey === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => toggleSort(opt.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {opt.label}
              {isActive && (
                <ArrowUpDown className={`w-3 h-3 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
              )}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {clients.length} cliente{clients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Client rows */}
      <div className="space-y-2">
        {paginated.map((client, i) => {
          const initials = client.full_name
            ? client.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            : "?";
          const st = statusLabels[client.status] || statusLabels.lead;
          return (
            <motion.button
              key={client.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              onClick={() => onSelect(client)}
              className="w-full flex items-center gap-4 p-4 bg-card border border-border/50 rounded-2xl hover:shadow-md hover:border-primary/20 transition-all text-left group"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((i) => Math.abs(i - safePage) <= 2 || i === 0 || i === totalPages - 1)
            .reduce<(number | "...")[]>((acc, i, idx, arr) => {
              if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(i);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`dots-${idx}`} className="text-muted-foreground text-xs px-1">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                    safePage === item
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {(item as number) + 1}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
