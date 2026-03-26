import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Users, UserCheck, UserX, Search, Download,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Trash2, RefreshCw, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  user_id: string | null;
  source: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

const PAGE_SIZE = 20;

export default function NewsletterTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "leads" | "registered" | "unsubscribed">("all");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (!error && data) {
      setSubscribers(data as Subscriber[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const filtered = subscribers.filter((s) => {
    if (filterType === "leads") return !s.user_id && s.status === "active";
    if (filterType === "registered") return !!s.user_id && s.status === "active";
    if (filterType === "unsubscribed") return s.status === "unsubscribed";
    return true;
  }).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.email.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const stats = {
    total: subscribers.filter((s) => s.status === "active").length,
    leads: subscribers.filter((s) => !s.user_id && s.status === "active").length,
    registered: subscribers.filter((s) => !!s.user_id && s.status === "active").length,
    unsubscribed: subscribers.filter((s) => s.status === "unsubscribed").length,
  };

  // Growth indicator: new subs in last 7 days
  const growthThisWeek = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    return subscribers.filter((s) => s.subscribed_at >= weekAgo && s.status === "active").length;
  }, [subscribers]);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const active = subscribers.filter((s) => s.status === "active");
    const sources: Record<string, number> = {};
    active.forEach((s) => {
      sources[s.source] = (sources[s.source] || 0) + 1;
    });
    return Object.entries(sources).sort((a, b) => b[1] - a[1]);
  }, [subscribers]);

  const sourceColors: Record<string, string> = {
    footer: "bg-primary/15 text-primary",
    landing: "bg-blue-500/15 text-blue-700",
    registration: "bg-emerald-500/15 text-emerald-700",
    popup: "bg-amber-500/15 text-amber-700",
  };

  function exportCSV() {
    const rows = [["Email", "Nome", "Tipo", "Fonte", "Status", "Data"].join(",")];
    filtered.forEach((s) => {
      rows.push([
        s.email,
        `"${(s.name || "").replace(/"/g, '""')}"`,
        s.user_id ? "Registrado" : "Lead",
        s.source,
        s.status,
        new Date(s.subscribed_at).toLocaleDateString("pt-BR"),
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  }

  async function handleUnsubscribe(id: string) {
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", id);
    fetchSubscribers();
    toast.success("Inscrito removido da newsletter");
  }

  async function handleResubscribe(id: string) {
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "active", unsubscribed_at: null })
      .eq("id", id);
    fetchSubscribers();
    toast.success("Inscrito reativado!");
  }

  // Bulk actions
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((s) => s.id)));
    }
  }

  async function bulkUnsubscribe() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("id", id);
    }
    setSelectedIds(new Set());
    fetchSubscribers();
    toast.success(`${ids.length} inscritos removidos`);
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from("newsletter_subscribers").delete().eq("id", id);
    }
    setSelectedIds(new Set());
    fetchSubscribers();
    toast.success(`${ids.length} inscritos excluídos`);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Ativos", value: stats.total, icon: Mail, color: "bg-primary/15 text-primary", badge: growthThisWeek > 0 ? `+${growthThisWeek} esta semana` : null },
          { label: "Leads", value: stats.leads, icon: Users, color: "bg-blue-500/15 text-blue-600", badge: null },
          { label: "Registrados", value: stats.registered, icon: UserCheck, color: "bg-emerald-500/15 text-emerald-600", badge: null },
          { label: "Cancelados", value: stats.unsubscribed, icon: UserX, color: "bg-destructive/15 text-destructive", badge: null },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-3xl p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                {s.badge && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />{s.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      {sourceBreakdown.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">Fontes:</span>
          {sourceBreakdown.map(([source, count]) => (
            <span key={source} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sourceColors[source] || "bg-muted text-muted-foreground"}`}>
              {source} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all", label: "Todos" },
            { key: "leads", label: "Leads" },
            { key: "registered", label: "Registrados" },
            { key: "unsubscribed", label: "Cancelados" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilterType(f.key); setPage(0); setSelectedIds(new Set()); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterType === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl"
          >
            <span className="text-sm font-semibold text-foreground">{selectedIds.size} selecionado(s)</span>
            <div className="flex-1" />
            <button
              onClick={bulkUnsubscribe}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserX className="w-3.5 h-3.5" /> Cancelar inscrição
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscriber List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded-full bg-border" />
                <div className="h-3 w-24 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">
          Nenhum inscrito encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All Header */}
          <div className="flex items-center gap-3 px-4 py-2">
            <Checkbox
              checked={paginated.length > 0 && selectedIds.size === paginated.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground font-medium">Selecionar todos</span>
          </div>

          {paginated.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-2xl"
            >
              <Checkbox
                checked={selectedIds.has(sub.id)}
                onCheckedChange={() => toggleSelect(sub.id)}
              />

              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{sub.email}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    sub.status === "unsubscribed"
                      ? "bg-destructive/15 text-destructive"
                      : sub.user_id
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-blue-500/15 text-blue-700"
                  }`}>
                    {sub.status === "unsubscribed" ? "Cancelado" : sub.user_id ? "Registrado" : "Lead"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{sub.source}</span>
                  {sub.name && <span className="text-[10px] text-muted-foreground">• {sub.name}</span>}
                </div>
              </div>

              <span className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">
                {new Date(sub.subscribed_at).toLocaleDateString("pt-BR")}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                {sub.status === "unsubscribed" && (
                  <button
                    onClick={() => handleResubscribe(sub.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    title="Reativar inscrição"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                {sub.status === "active" && (
                  <button
                    onClick={() => handleUnsubscribe(sub.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Cancelar inscrição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(0)} disabled={safePage === 0} className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground disabled:opacity-30 transition-colors">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground px-2">{safePage + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground disabled:opacity-30 transition-colors">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
