import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ThumbsUp, ThumbsDown, Download, Search, MessageSquare, TrendingUp, AlertTriangle, CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FeedbackTrendChart from "@/components/admin/FeedbackTrendChart";

type FeedbackRow = {
  id: string;
  user_id: string;
  conversation_id: string;
  message_content: string;
  rating: string;
  reason: string | null;
  comment: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [period, setPeriod] = useState<string>("30");

  useEffect(() => { setPage(0); }, [ratingFilter, searchQuery]);

  useEffect(() => {
    fetchFeedbacks();
  }, [page, ratingFilter, searchQuery]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("chat_feedback" as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (ratingFilter !== "all") {
      query = query.eq("rating", ratingFilter);
    }
    if (searchQuery.trim()) {
      query = query.or(`message_content.ilike.%${searchQuery}%,comment.ilike.%${searchQuery}%,reason.ilike.%${searchQuery}%`);
    }

    const { data, count } = await query;
    setFeedbacks((data as unknown as FeedbackRow[] | null) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  // KPIs
  const [allFeedbacks, setAllFeedbacks] = useState<FeedbackRow[]>([]);
  useEffect(() => {
    supabase.from("chat_feedback" as any).select("rating, created_at, reason").then(({ data }) => {
      setAllFeedbacks((data as unknown as FeedbackRow[] | null) || []);
    });
  }, []);

  const filteredByPeriod = useMemo(() => {
    if (period === "all") return allFeedbacks;
    const days = Number(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allFeedbacks.filter(f => new Date(f.created_at) >= cutoff);
  }, [allFeedbacks, period]);

  const kpis = useMemo(() => {
    const totalCount = filteredByPeriod.length;
    const positives = filteredByPeriod.filter(f => f.rating === "positive").length;
    const negatives = filteredByPeriod.filter(f => f.rating === "negative").length;
    const rate = totalCount > 0 ? Math.round((positives / totalCount) * 100) : 0;
    const today = new Date().toISOString().split("T")[0];
    const todayCount = filteredByPeriod.filter(f => f.created_at?.startsWith(today)).length;
    return { totalCount, positives, negatives, rate, todayCount };
  }, [filteredByPeriod]);

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["Data", "Rating", "Motivo", "Comentário", "Conteúdo da Mensagem"];
    const rows = feedbacks.map(f => [
      format(new Date(f.created_at), "dd/MM/yyyy HH:mm"),
      f.rating === "positive" ? "Positivo" : "Negativo",
      f.reason || "",
      f.comment || "",
      f.message_content.replace(/"/g, '""'),
    ]);
    const csv = BOM + [headers.join(";"), ...rows.map(r => r.map(c => `"${c}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedbacks-super-ia-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feedback da Super IA</h1>
            <p className="text-sm text-muted-foreground">Monitore a satisfação e melhore as respostas automaticamente</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: kpis.totalCount, icon: MessageSquare, color: "text-primary" },
            { label: "Satisfação", value: `${kpis.rate}%`, icon: TrendingUp, color: "text-emerald-500" },
            { label: "Negativos", value: kpis.negatives, icon: AlertTriangle, color: "text-destructive" },
            { label: "Hoje", value: kpis.todayCount, icon: CalendarDays, color: "text-primary" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trend Charts */}
        <FeedbackTrendChart feedbacks={allFeedbacks} />

        {/* Negative Reasons Ranking */}
        {(() => {
          const negatives = allFeedbacks.filter(f => f.rating === "negative" && f.reason);
          const reasonCounts: Record<string, number> = {};
          negatives.forEach(f => {
            if (f.reason) reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
          });
          const sorted = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
          const max = sorted[0]?.[1] || 1;
          if (sorted.length === 0) return null;
          return (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Motivos Negativos Mais Frequentes</h3>
              <div className="space-y-2.5">
                {sorted.map(([reason, count], i) => (
                  <div key={reason} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground truncate">{reason}</span>
                        <span className="text-xs font-semibold text-muted-foreground ml-2">{count}×</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive/70 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no conteúdo, motivo ou comentário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Filtrar rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="positive">Positivos</SelectItem>
              <SelectItem value="negative">Negativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Rating</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Motivo</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Comentário</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell">Mensagem</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : feedbacks.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum feedback encontrado</td></tr>
                ) : feedbacks.map((f) => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      {f.rating === "positive" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 gap-1">
                          <ThumbsUp className="h-3 w-3" /> Positivo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 gap-1">
                          <ThumbsDown className="h-3 w-3" /> Negativo
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-foreground">{f.reason || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{f.comment || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell max-w-[250px] truncate">{f.message_content.slice(0, 100)}</td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(f.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{total} feedbacks</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
