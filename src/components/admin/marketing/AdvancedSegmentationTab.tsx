import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Users, Filter, Target, TrendingUp, Crown, ShoppingCart,
  Clock, Star, Save, Trash2, Eye, Loader2, ChevronDown,
  BarChart3, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerProfile {
  user_id: string;
  full_name: string | null;
  email?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
  avgOrderValue: number;
  rfmScore: { r: number; f: number; m: number; segment: string };
}

interface SavedSegment {
  key: string;
  name: string;
  filters: SegmentFilters;
  count: number;
  created_at: string;
}

interface SegmentFilters {
  minSpent: string;
  maxSpent: string;
  minOrders: string;
  maxOrders: string;
  daysInactive: string;
  maxDaysInactive: string;
  status: string;
  tagId: string;
  rfmSegment: string;
  hasNewsletter: string;
  hasPet: string;
}

const defaultFilters: SegmentFilters = {
  minSpent: "", maxSpent: "", minOrders: "", maxOrders: "",
  daysInactive: "", maxDaysInactive: "", status: "", tagId: "",
  rfmSegment: "", hasNewsletter: "", hasPet: "",
};

const rfmSegments: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  champion: { label: "Campeão", color: "text-amber-600 bg-amber-500/15", icon: Crown },
  loyal: { label: "Leal", color: "text-emerald-600 bg-emerald-500/15", icon: Star },
  potential: { label: "Potencial", color: "text-blue-600 bg-blue-500/15", icon: TrendingUp },
  new_customer: { label: "Novo", color: "text-violet-600 bg-violet-500/15", icon: Zap },
  at_risk: { label: "Em risco", color: "text-orange-600 bg-orange-500/15", icon: Clock },
  lost: { label: "Perdido", color: "text-destructive bg-destructive/15", icon: Trash2 },
};

function calcRFM(daysSince: number, frequency: number, monetary: number, maxDays: number, maxFreq: number, maxMon: number) {
  const r = maxDays > 0 ? Math.max(1, Math.min(5, Math.ceil((1 - daysSince / maxDays) * 5))) : 3;
  const f = maxFreq > 0 ? Math.max(1, Math.min(5, Math.ceil((frequency / maxFreq) * 5))) : 1;
  const m = maxMon > 0 ? Math.max(1, Math.min(5, Math.ceil((monetary / maxMon) * 5))) : 1;

  let segment = "potential";
  if (r >= 4 && f >= 4 && m >= 4) segment = "champion";
  else if (r >= 3 && f >= 3) segment = "loyal";
  else if (r >= 4 && f <= 2) segment = "new_customer";
  else if (r <= 2 && f >= 3) segment = "at_risk";
  else if (r <= 2 && f <= 2) segment = "lost";

  return { r, f, m, segment };
}

export default function AdvancedSegmentationTab() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SegmentFilters>(defaultFilters);
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [segmentName, setSegmentName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [profRes, ordRes, tagsRes, petsRes, newsRes, settingsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("orders").select("user_id, total, created_at"),
        supabase.from("customer_tags").select("id, name").order("name"),
        supabase.from("pets").select("user_id"),
        supabase.from("newsletter_subscribers").select("user_id, status").not("user_id", "is", null),
        supabase.from("store_settings").select("key, value").eq("key", "saved_segments"),
      ]);

      const profs = profRes.data || [];
      const orders = ordRes.data || [];
      setTags(tagsRes.data || []);

      const petUserIds = new Set((petsRes.data || []).map((p: any) => p.user_id));
      const newsUserIds = new Set((newsRes.data || []).filter((n: any) => n.status === "active").map((n: any) => n.user_id));

      // Build customer profiles with order data
      const ordersByUser: Record<string, { total: number; count: number; lastDate: string | null }> = {};
      orders.forEach((o: any) => {
        if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = { total: 0, count: 0, lastDate: null };
        ordersByUser[o.user_id].total += Number(o.total);
        ordersByUser[o.user_id].count += 1;
        if (!ordersByUser[o.user_id].lastDate || o.created_at > ordersByUser[o.user_id].lastDate!) {
          ordersByUser[o.user_id].lastDate = o.created_at;
        }
      });

      const now = Date.now();
      const maxDays = Math.max(1, ...Object.values(ordersByUser).map(o => o.lastDate ? Math.floor((now - new Date(o.lastDate).getTime()) / 86400000) : 0));
      const maxFreq = Math.max(1, ...Object.values(ordersByUser).map(o => o.count));
      const maxMon = Math.max(1, ...Object.values(ordersByUser).map(o => o.total));

      const customerProfiles: CustomerProfile[] = profs.map((p: any) => {
        const od = ordersByUser[p.user_id] || { total: 0, count: 0, lastDate: null };
        const daysSince = od.lastDate ? Math.floor((now - new Date(od.lastDate).getTime()) / 86400000) : 9999;
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          totalSpent: od.total,
          orderCount: od.count,
          lastOrderDate: od.lastDate,
          daysSinceLastOrder: daysSince,
          avgOrderValue: od.count > 0 ? od.total / od.count : 0,
          rfmScore: calcRFM(daysSince === 9999 ? maxDays : daysSince, od.count, od.total, maxDays, maxFreq, maxMon),
          _hasPet: petUserIds.has(p.user_id),
          _hasNewsletter: newsUserIds.has(p.user_id),
        } as any;
      });

      setProfiles(customerProfiles);

      // Load saved segments
      const saved = settingsRes.data?.[0]?.value;
      if (saved && Array.isArray((saved as any).segments)) {
        setSavedSegments((saved as any).segments);
      }

      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p: any) => {
      if (filters.minSpent && p.totalSpent < Number(filters.minSpent)) return false;
      if (filters.maxSpent && p.totalSpent > Number(filters.maxSpent)) return false;
      if (filters.minOrders && p.orderCount < Number(filters.minOrders)) return false;
      if (filters.maxOrders && p.orderCount > Number(filters.maxOrders)) return false;
      if (filters.daysInactive && p.daysSinceLastOrder < Number(filters.daysInactive)) return false;
      if (filters.maxDaysInactive && p.daysSinceLastOrder > Number(filters.maxDaysInactive)) return false;
      if (filters.rfmSegment && p.rfmScore.segment !== filters.rfmSegment) return false;
      if (filters.hasPet === "yes" && !p._hasPet) return false;
      if (filters.hasPet === "no" && p._hasPet) return false;
      if (filters.hasNewsletter === "yes" && !p._hasNewsletter) return false;
      if (filters.hasNewsletter === "no" && p._hasNewsletter) return false;
      return true;
    });
  }, [profiles, filters]);

  // RFM distribution
  const rfmDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    profiles.forEach(p => {
      dist[p.rfmScore.segment] = (dist[p.rfmScore.segment] || 0) + 1;
    });
    return dist;
  }, [profiles]);

  async function saveSegment() {
    if (!segmentName.trim()) return;
    const newSeg: SavedSegment = {
      key: Date.now().toString(),
      name: segmentName,
      filters,
      count: filtered.length,
      created_at: new Date().toISOString(),
    };
    const updated = [...savedSegments, newSeg];
    await supabase.from("store_settings").upsert({
      key: "saved_segments",
      value: { segments: updated } as any,
    });
    setSavedSegments(updated);
    setSegmentName("");
    setShowSaveForm(false);
    toast.success("Segmento salvo!");
  }

  async function deleteSegment(key: string) {
    const updated = savedSegments.filter(s => s.key !== key);
    await supabase.from("store_settings").upsert({
      key: "saved_segments",
      value: { segments: updated } as any,
    });
    setSavedSegments(updated);
    toast.success("Segmento removido");
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* RFM Overview */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Análise RFM — Segmentos de Clientes</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(rfmSegments).map(([key, seg]) => {
            const count = rfmDistribution[key] || 0;
            const pct = profiles.length > 0 ? ((count / profiles.length) * 100).toFixed(0) : "0";
            return (
              <button
                key={key}
                onClick={() => setFilters({ ...defaultFilters, rfmSegment: filters.rfmSegment === key ? "" : key })}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  filters.rfmSegment === key ? "border-primary shadow-md" : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <seg.icon className={`w-5 h-5 mx-auto mb-2 ${seg.color.split(" ")[0]}`} />
                <p className="text-lg font-extrabold text-foreground">{count}</p>
                <p className="text-[10px] font-semibold text-muted-foreground">{seg.label}</p>
                <p className="text-[10px] text-muted-foreground">{pct}%</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Filtros Avançados</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {filtered.length} clientes
            </span>
            <button onClick={() => setFilters(defaultFilters)} className="text-xs text-muted-foreground hover:text-foreground">
              Limpar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { key: "minSpent" as const, label: "Gasto mín. (R$)", type: "number" },
            { key: "maxSpent" as const, label: "Gasto máx. (R$)", type: "number" },
            { key: "minOrders" as const, label: "Pedidos mín.", type: "number" },
            { key: "maxOrders" as const, label: "Pedidos máx.", type: "number" },
            { key: "daysInactive" as const, label: "Inativo há (dias)", type: "number" },
            { key: "maxDaysInactive" as const, label: "Ativo até (dias)", type: "number" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">{f.label}</label>
              <input
                type={f.type}
                value={filters[f.key]}
                onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                placeholder="—"
                className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Segmento RFM</label>
            <select value={filters.rfmSegment} onChange={(e) => setFilters({ ...filters, rfmSegment: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos</option>
              {Object.entries(rfmSegments).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Tag</label>
            <select value={filters.tagId} onChange={(e) => setFilters({ ...filters, tagId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todas</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Tem pet?</label>
            <select value={filters.hasPet} onChange={(e) => setFilters({ ...filters, hasPet: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos</option>
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Newsletter?</label>
            <select value={filters.hasNewsletter} onChange={(e) => setFilters({ ...filters, hasNewsletter: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos</option>
              <option value="yes">Inscrito</option>
              <option value="no">Não inscrito</option>
            </select>
          </div>
        </div>

        {/* Save segment */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          {showSaveForm ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="Nome do segmento..."
                className="flex-1 px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={saveSegment} disabled={!segmentName.trim()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                <Save className="w-3.5 h-3.5 inline mr-1" />Salvar
              </button>
              <button onClick={() => setShowSaveForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setShowSaveForm(true)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              <Save className="w-3.5 h-3.5" /> Salvar segmento
            </button>
          )}
        </div>
      </div>

      {/* Saved Segments */}
      {savedSegments.length > 0 && (
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Segmentos Salvos
          </p>
          <div className="flex flex-wrap gap-2">
            {savedSegments.map((seg) => (
              <div key={seg.key} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <button onClick={() => setFilters(seg.filters)} className="text-xs font-semibold text-foreground hover:text-primary">
                  {seg.name}
                </button>
                <span className="text-[10px] text-muted-foreground">({seg.count})</span>
                <button onClick={() => deleteSegment(seg.key)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer List Preview */}
      <div className="bg-card rounded-3xl p-5">
        <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Clientes no Segmento ({filtered.length})
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-muted-foreground uppercase">
                <th className="pb-3 pr-4">Cliente</th>
                <th className="pb-3 pr-4">Pedidos</th>
                <th className="pb-3 pr-4">Total gasto</th>
                <th className="pb-3 pr-4">Ticket médio</th>
                <th className="pb-3 pr-4">Último pedido</th>
                <th className="pb-3">Segmento RFM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((c) => {
                const seg = rfmSegments[c.rfmScore.segment];
                return (
                  <tr key={c.user_id} className="border-t border-border/30">
                    <td className="py-3 pr-4 font-semibold text-foreground">{c.full_name || "—"}</td>
                    <td className="py-3 pr-4">{c.orderCount}</td>
                    <td className="py-3 pr-4">R$ {c.totalSpent.toFixed(2)}</td>
                    <td className="py-3 pr-4">R$ {c.avgOrderValue.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="py-3">
                      {seg && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${seg.color}`}>
                          {seg.label} ({c.rfmScore.r}{c.rfmScore.f}{c.rfmScore.m})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 20 && (
            <p className="text-xs text-muted-foreground text-center mt-3">Mostrando 20 de {filtered.length} clientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
