import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Star, TrendingUp, Gift, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";

interface PointEntry {
  id: string;
  points: number;
  source: string;
  description: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

const sourceIcons: Record<string, typeof Star> = {
  purchase: ShoppingBag,
  bonus: Gift,
  referral: TrendingUp,
};

const sourceLabels: Record<string, string> = {
  purchase: "Compra",
  bonus: "Bônus",
  referral: "Indicação",
  redemption: "Resgate",
};

export default function LoyaltyPointsTab() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) loadPoints();
  }, [user, page]);

  const loadPoints = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Get total points (all-time sum) only on first load
    if (page === 0) {
      const { data: allData } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("user_id", user!.id);
      setTotalPoints((allData || []).reduce((sum, e) => sum + e.points, 0));
    }

    const { data, count } = await supabase
      .from("loyalty_points")
      .select("*", { count: "exact" })
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    setEntries((data as PointEntry[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading && page === 0) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      {/* Points balance card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 sm:p-8 text-primary-foreground text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <Star className="mx-auto h-10 w-10 mb-2 opacity-80" />
        <p className="text-sm font-medium opacity-80 mb-1">Seus pontos</p>
        <p className="text-5xl font-bold font-display">{totalPoints}</p>
        <p className="text-xs opacity-70 mt-2">1 ponto = R$ 0,01 em desconto</p>
      </div>

      {/* How it works */}
      <div className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6">
        <p className="text-sm font-bold text-foreground mb-3">Como funciona</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">Compre</p>
            <p className="text-[10px] text-muted-foreground">1 pt / R$ 1</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">Acumule</p>
            <p className="text-[10px] text-muted-foreground">Sem expirar</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">Troque</p>
            <p className="text-[10px] text-muted-foreground">Por descontos</p>
          </div>
        </div>
      </div>

      {/* History */}
      {entries.length === 0 && page === 0 ? (
        <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
          <Star className="mx-auto h-12 w-12 text-primary/40 mb-3" />
          <p className="text-lg font-semibold text-foreground">Nenhum ponto ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Faça sua primeira compra para começar a acumular pontos!</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6">
          <p className="text-sm font-bold text-foreground mb-3">Histórico</p>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              entries.map((entry, i) => {
                const Icon = sourceIcons[entry.source] || Star;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {entry.description || sourceLabels[entry.source] || entry.source}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${entry.points > 0 ? "text-green-600" : "text-destructive"}`}>
                      {entry.points > 0 ? "+" : ""}{entry.points}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 mt-3 border-t border-border/50">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
