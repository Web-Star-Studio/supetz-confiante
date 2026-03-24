import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScrollText, Filter, Search, User, Calendar, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const entityLabels: Record<string, string> = {
  order: "Pedido",
  product: "Produto",
  customer: "Cliente",
  coupon: "Cupom",
  campaign: "Campanha",
  expense: "Despesa",
  stock: "Estoque",
  settings: "Configurações",
  loyalty: "Fidelização",
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600",
  update: "bg-blue-500/10 text-blue-600",
  delete: "bg-destructive/10 text-destructive",
  login: "bg-primary/10 text-primary",
  export: "bg-amber-500/10 text-amber-600",
};

export default function Auditoria() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);

    const { data } = await query;
    if (data) {
      setLogs(data as AuditLog[]);

      // Fetch admin emails for display
      const adminIds = [...new Set(data.map((l: AuditLog) => l.admin_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", adminIds);

      if (profiles) {
        const map: Record<string, string> = {};
        profiles.forEach((p) => {
          map[p.user_id] = p.full_name || "Admin";
        });
        setAdminEmails(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  // Log admin page visit
  useEffect(() => {
    if (user) {
      supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "view",
        entity_type: "audit",
        details: { page: "auditoria" },
      });
    }
  }, [user]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.entity_type.toLowerCase().includes(s) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(s)) ||
      JSON.stringify(log.details).toLowerCase().includes(s)
    );
  });

  const uniqueEntities = [...new Set(logs.map((l) => l.entity_type))];
  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-primary" />
              Logs de Auditoria
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico de todas as ações administrativas
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ações, entidades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas entidades</SelectItem>
              {uniqueEntities.map((e) => (
                <SelectItem key={e} value={e}>
                  {entityLabels[e] || e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40 rounded-xl">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: logs.length, color: "text-foreground" },
            { label: "Criações", value: logs.filter((l) => l.action === "create").length, color: "text-emerald-600" },
            { label: "Atualizações", value: logs.filter((l) => l.action === "update").length, color: "text-blue-600" },
            { label: "Exclusões", value: logs.filter((l) => l.action === "delete").length, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Logs list */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum log encontrado</p>
              <p className="text-xs mt-1">As ações dos administradores aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((log) => (
                <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          actionColors[log.action] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {entityLabels[log.entity_type] || log.entity_type}
                        </span>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            #{log.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {Object.entries(log.details)
                            .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {adminEmails[log.admin_id] || "Admin"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
