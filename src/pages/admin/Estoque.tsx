import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Search,
  Plus, Minus, RotateCcw, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Boxes,
  BarChart3, Target, Layers, DollarSign, Activity, Download, Zap, Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, differenceInDays } from "date-fns";

interface Product {
  id: string;
  title: string;
  quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  price: number;
  active: boolean;
}

interface StockMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: typeof Plus; class: string }> = {
  in: { label: "Entrada", icon: ArrowUpCircle, class: "text-emerald-600 bg-emerald-500/15" },
  out: { label: "Saída", icon: ArrowDownCircle, class: "text-red-600 bg-red-500/15" },
  sale: { label: "Venda", icon: TrendingDown, class: "text-blue-600 bg-blue-500/15" },
  adjustment: { label: "Ajuste", icon: RotateCcw, class: "text-amber-600 bg-amber-500/15" },
  return: { label: "Devolução", icon: TrendingUp, class: "text-violet-600 bg-violet-500/15" },
};

export default function AdminEstoque() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState("inventario");

  // Adjustment form
  const [adjustProduct, setAdjustProduct] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"in" | "out" | "adjustment">("in");
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [prodRes, movRes] = await Promise.all([
      supabase.from("products").select("id, title, quantity, low_stock_threshold, image_url, price, active").order("title"),
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setMovements((movRes.data as StockMovement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lowStockCount = useMemo(() => products.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.quantity === 0).length, [products]);
  const totalStock = useMemo(() => products.reduce((s, p) => s + p.quantity, 0), [products]);
  const totalStockValue = useMemo(() => products.reduce((s, p) => s + p.quantity * p.price, 0), [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (filter === "low") result = result.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0);
    if (filter === "out") result = result.filter(p => p.quantity === 0);
    if (search) { const q = search.toLowerCase(); result = result.filter(p => p.title.toLowerCase().includes(q)); }
    return result;
  }, [products, filter, search]);

  // ─── Analytics ───
  const analytics = useMemo(() => {
    const now = new Date();
    const last30 = subDays(now, 30);

    // ABC Analysis (by revenue = sales qty * price)
    const productSales = products.map(p => {
      const salesMov = movements.filter(m => m.product_id === p.id && m.type === "sale");
      const totalSold = salesMov.reduce((s, m) => s + m.quantity, 0);
      const revenue = totalSold * p.price;
      return { ...p, totalSold, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = productSales.reduce((s, p) => s + p.revenue, 0);
    let cumRevenue = 0;
    const abcData = productSales.map(p => {
      cumRevenue += p.revenue;
      const cumPercent = totalRevenue > 0 ? (cumRevenue / totalRevenue) * 100 : 0;
      const category = cumPercent <= 80 ? "A" : cumPercent <= 95 ? "B" : "C";
      return { ...p, cumPercent, category };
    });

    const abcSummary = {
      A: abcData.filter(p => p.category === "A"),
      B: abcData.filter(p => p.category === "B"),
      C: abcData.filter(p => p.category === "C"),
    };

    // Movement trend (last 30 days)
    const movByDay: Record<string, { entradas: number; saidas: number; vendas: number }> = {};
    for (let i = 29; i >= 0; i--) {
      movByDay[format(subDays(now, i), "dd/MM")] = { entradas: 0, saidas: 0, vendas: 0 };
    }
    movements.forEach(m => {
      const d = new Date(m.created_at);
      if (d >= last30) {
        const key = format(d, "dd/MM");
        if (movByDay[key]) {
          if (m.type === "in" || m.type === "return") movByDay[key].entradas += m.quantity;
          else if (m.type === "sale") movByDay[key].vendas += m.quantity;
          else if (m.type === "out") movByDay[key].saidas += m.quantity;
        }
      }
    });
    const movTrend = Object.entries(movByDay).map(([day, v]) => ({ day, ...v }));

    // Stock value by product (top 10)
    const stockValueByProduct = products
      .map(p => ({ name: p.title.length > 20 ? p.title.substring(0, 20) + "…" : p.title, value: p.quantity * p.price, qty: p.quantity }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Turnover rate (sales qty / avg stock) per product
    const turnoverData = products.map(p => {
      const salesMov = movements.filter(m => m.product_id === p.id && m.type === "sale");
      const totalSold = salesMov.reduce((s, m) => s + m.quantity, 0);
      const avgStock = p.quantity > 0 ? p.quantity : 1;
      const turnover = totalSold / avgStock;
      const daysOfStock = totalSold > 0 ? Math.round((p.quantity / (totalSold / 30))) : 999;
      return { ...p, totalSold, turnover: Math.round(turnover * 100) / 100, daysOfStock };
    }).sort((a, b) => b.turnover - a.turnover);

    // Demand forecast (simple: avg daily sales * 30)
    const forecast = products.map(p => {
      const salesMov = movements.filter(m => m.product_id === p.id && m.type === "sale" && new Date(m.created_at) >= last30);
      const totalSold30 = salesMov.reduce((s, m) => s + m.quantity, 0);
      const dailyAvg = totalSold30 / 30;
      const forecast30 = Math.round(dailyAvg * 30);
      const daysUntilOut = dailyAvg > 0 ? Math.round(p.quantity / dailyAvg) : 999;
      const needsRestock = daysUntilOut <= 14;
      const suggestedOrder = Math.max(0, forecast30 - p.quantity + p.low_stock_threshold);
      return { ...p, totalSold30, dailyAvg, forecast30, daysUntilOut, needsRestock, suggestedOrder };
    }).sort((a, b) => a.daysUntilOut - b.daysUntilOut);

    // Movement type distribution
    const typeDistribution: Record<string, number> = {};
    movements.forEach(m => {
      const label = typeConfig[m.type]?.label || m.type;
      typeDistribution[label] = (typeDistribution[label] || 0) + m.quantity;
    });
    const typeDist = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

    return { abcData, abcSummary, movTrend, stockValueByProduct, turnoverData, forecast, typeDist };
  }, [products, movements]);

  const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];
  const ABC_COLORS: Record<string, string> = { A: "#10b981", B: "#f59e0b", C: "#ef4444" };

  async function handleAdjust() {
    if (!adjustProduct || adjustQty <= 0 || !user) return;
    setSaving(true);
    const prod = products.find(p => p.id === adjustProduct);
    if (!prod) { setSaving(false); return; }
    const delta = adjustType === "out" ? -adjustQty : adjustQty;
    const newStock = Math.max(0, prod.quantity + delta);
    await supabase.from("stock_movements").insert({ product_id: adjustProduct, type: adjustType, quantity: adjustQty, previous_stock: prod.quantity, new_stock: newStock, reason: adjustReason || null, created_by: user.id });
    await supabase.from("products").update({ quantity: newStock }).eq("id", adjustProduct);
    log({ action: "update", entity_type: "stock", entity_id: adjustProduct, details: { type: adjustType, qty: adjustQty, reason: adjustReason, newStock } });
    setAdjustProduct(null); setAdjustQty(1); setAdjustReason(""); setSaving(false);
    fetchData();
  }

  const exportCSV = () => {
    const headers = ["Produto", "Estoque", "Limiar", "Preço", "Valor em Estoque", "Classe ABC", "Giro", "Dias até Esgotar"];
    const rows = analytics.forecast.map(p => {
      const abc = analytics.abcData.find(a => a.id === p.id);
      const turnover = analytics.turnoverData.find(t => t.id === p.id);
      return [p.title, p.quantity, p.low_stock_threshold, p.price.toFixed(2), (p.quantity * p.price).toFixed(2), abc?.category || "C", turnover?.turnover || 0, p.daysUntilOut >= 999 ? "∞" : p.daysUntilOut];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `estoque-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Estoque</h1>
          <p className="text-muted-foreground mt-1">Controle inteligente de inventário</p>
        </div>
        <button onClick={exportCSV} className="bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted/80 transition">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <button onClick={() => { setFilter("all"); setMainTab("inventario"); }} className={`bg-card rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "all" && mainTab === "inventario" ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}>
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center"><Boxes className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Total</p><p className="text-xl font-extrabold text-foreground">{totalStock}</p></div>
        </button>
        <div className="bg-card rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Valor</p><p className="text-xl font-extrabold text-foreground">R$ {totalStockValue.toFixed(0)}</p></div>
        </div>
        <div className="bg-card rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center"><Package className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Produtos</p><p className="text-xl font-extrabold text-foreground">{products.length}</p></div>
        </div>
        <button onClick={() => { setFilter("low"); setMainTab("inventario"); }} className={`bg-card rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "low" ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/10" : ""}`}>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Baixo</p><p className="text-xl font-extrabold text-amber-600">{lowStockCount}</p></div>
        </button>
        <button onClick={() => { setFilter("out"); setMainTab("inventario"); }} className={`bg-card rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "out" ? "ring-2 ring-destructive shadow-lg shadow-destructive/10" : ""}`}>
          <div className="w-10 h-10 rounded-2xl bg-destructive/15 flex items-center justify-center"><Package className="w-5 h-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Esgotado</p><p className="text-xl font-extrabold text-destructive">{outOfStockCount}</p></div>
        </button>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-muted mb-4">
          <TabsTrigger value="inventario" className="gap-1"><Package className="w-3.5 h-3.5" /> Inventário</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="abc" className="gap-1"><Layers className="w-3.5 h-3.5" /> Curva ABC</TabsTrigger>
          <TabsTrigger value="previsao" className="gap-1"><Target className="w-3.5 h-3.5" /> Previsão</TabsTrigger>
          <TabsTrigger value="giro" className="gap-1"><Activity className="w-3.5 h-3.5" /> Giro</TabsTrigger>
        </TabsList>

        {/* ── INVENTÁRIO TAB ── */}
        <TabsContent value="inventario" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>

          <AnimatePresence>
            {adjustProduct && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-card rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-foreground">Ajustar estoque: {products.find(p => p.id === adjustProduct)?.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex gap-2">
                      {(["in", "out", "adjustment"] as const).map(t => {
                        const cfg = typeConfig[t];
                        return (
                          <button key={t} onClick={() => setAdjustType(t)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${adjustType === t ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}>
                            <cfg.icon className="w-3.5 h-3.5" />{cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <input type="number" min={1} value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} className="w-20 px-3 py-2.5 rounded-2xl bg-muted text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Motivo (opcional)" className="flex-1 min-w-[150px] px-4 py-2.5 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={handleAdjust} disabled={saving} className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50">{saving ? "Salvando..." : "Confirmar"}</button>
                    <button onClick={() => setAdjustProduct(null)} className="px-4 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="bg-card rounded-3xl p-5 animate-pulse flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-border" /><div className="flex-1 space-y-2"><div className="h-4 w-40 rounded-full bg-border" /><div className="h-3 w-24 rounded-full bg-border" /></div></div>)}</div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhum produto encontrado.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((prod, i) => {
                const isExpanded = expandedId === prod.id;
                const isLow = prod.quantity <= prod.low_stock_threshold && prod.quantity > 0;
                const isOut = prod.quantity === 0;
                const prodMovements = movements.filter(m => m.product_id === prod.id).slice(0, 10);
                const abc = analytics.abcData.find(a => a.id === prod.id);

                return (
                  <motion.div key={prod.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="bg-card rounded-3xl overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      {prod.image_url ? <img src={prod.image_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-primary" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{prod.title}</p>
                        <p className="text-xs text-muted-foreground">R$ {prod.price.toFixed(2)} · Classe {abc?.category || "C"}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOut ? "bg-destructive/15 text-destructive" : isLow ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>
                        {isOut && <AlertTriangle className="w-3 h-3" />}{prod.quantity} un.
                      </div>
                      <button onClick={() => setAdjustProduct(prod.id)} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex-shrink-0"><Plus className="w-3 h-3 inline mr-1" />Ajustar</button>
                      <button onClick={() => setExpandedId(isExpanded ? null : prod.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 border-t border-border/50">
                            <div className="flex items-center justify-between pt-3 mb-3">
                              <p className="text-xs font-semibold text-muted-foreground">Histórico de movimentações</p>
                              <span className="text-xs text-muted-foreground">Alerta: ≤ {prod.low_stock_threshold} un.</span>
                            </div>
                            {prodMovements.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">Sem movimentações</p> : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {prodMovements.map(mov => {
                                  const cfg = typeConfig[mov.type] || typeConfig.adjustment;
                                  const MIcon = cfg.icon;
                                  return (
                                    <div key={mov.id} className="flex items-center gap-3 p-2.5 bg-muted rounded-2xl">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.class}`}><MIcon className="w-3.5 h-3.5" /></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{cfg.label} — {mov.quantity} un.</p>
                                        <p className="text-[10px] text-muted-foreground">{mov.previous_stock} → {mov.new_stock}{mov.reason ? ` · ${mov.reason}` : ""}</p>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(mov.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── ANALYTICS TAB ── */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Movement trend */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Movimentações (30 dias)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.movTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" />
                    <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" fill="rgba(16,185,129,0.2)" />
                    <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#ef4444" fill="rgba(239,68,68,0.2)" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock value distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Valor em Estoque (Top 10)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stockValueByProduct} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="value" name="Valor" fill="hsl(var(--primary) / 0.7)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Movement type distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-500" /> Tipo de Movimentação</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.typeDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                      {analytics.typeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary cards */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Resumo Inteligente</h3>
              <div className="space-y-3">
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Produtos que precisam reposição em 14 dias</p>
                  <p className="text-2xl font-black text-foreground">{analytics.forecast.filter(f => f.needsRestock).length}</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Valor total em estoque</p>
                  <p className="text-2xl font-black text-emerald-600">R$ {totalStockValue.toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Movimentações nos últimos 30 dias</p>
                  <p className="text-2xl font-black text-foreground">{movements.filter(m => new Date(m.created_at) >= subDays(new Date(), 30)).length}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── ABC TAB ── */}
        <TabsContent value="abc" className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {(["A", "B", "C"] as const).map(cat => (
              <div key={cat} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: ABC_COLORS[cat] }}>{cat}</span>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold">{cat === "A" ? "Alta prioridade (80% receita)" : cat === "B" ? "Média prioridade (15% receita)" : "Baixa prioridade (5% receita)"}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-foreground">{analytics.abcSummary[cat].length} produtos</p>
                <p className="text-xs text-muted-foreground">R$ {analytics.abcSummary[cat].reduce((s, p) => s + p.revenue, 0).toFixed(2).replace(".", ",")} em receita</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Classe</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Vendidos</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Receita</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">% Acumulado</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.abcData.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3"><span className="w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-black text-white" style={{ background: ABC_COLORS[p.category] }}>{p.category}</span></td>
                      <td className="px-4 py-3 font-bold text-foreground">{p.title}</td>
                      <td className="px-4 py-3 text-foreground">{p.totalSold}</td>
                      <td className="px-4 py-3 text-foreground font-bold">R$ {p.revenue.toFixed(2).replace(".", ",")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.cumPercent.toFixed(1)}%</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${p.quantity <= p.low_stock_threshold ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>{p.quantity} un.</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── PREVISÃO TAB ── */}
        <TabsContent value="previsao" className="space-y-4">
          {analytics.forecast.filter(f => f.needsRestock).length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Atenção: {analytics.forecast.filter(f => f.needsRestock).length} produto(s) precisam de reposição nos próximos 14 dias</h3>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Estoque</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Vendas/30d</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Média/dia</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Previsão 30d</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Dias até esgotar</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Sugestão Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.forecast.map(p => (
                    <tr key={p.id} className={`border-b border-border/50 hover:bg-muted/30 ${p.needsRestock ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                      <td className="px-4 py-3 font-bold text-foreground">{p.title}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${p.quantity <= p.low_stock_threshold ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>{p.quantity} un.</span></td>
                      <td className="px-4 py-3 text-foreground">{p.totalSold30}</td>
                      <td className="px-4 py-3 text-foreground">{p.dailyAvg.toFixed(1)}</td>
                      <td className="px-4 py-3 text-foreground font-bold">{p.forecast30}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.daysUntilOut <= 7 ? "bg-destructive/15 text-destructive" : p.daysUntilOut <= 14 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>
                          {p.daysUntilOut >= 999 ? "∞" : `${p.daysUntilOut}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-bold">{p.suggestedOrder > 0 ? `${p.suggestedOrder} un.` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── GIRO TAB ── */}
        <TabsContent value="giro" className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Estoque</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Total Vendido</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Taxa de Giro</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Cobertura</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.turnoverData.map(p => {
                    const status = p.turnover >= 3 ? { label: "Alto giro", class: "bg-emerald-500/15 text-emerald-700" } : p.turnover >= 1 ? { label: "Giro médio", class: "bg-blue-500/15 text-blue-700" } : p.turnover > 0 ? { label: "Baixo giro", class: "bg-amber-500/15 text-amber-700" } : { label: "Parado", class: "bg-destructive/15 text-destructive" };
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-bold text-foreground">{p.title}</td>
                        <td className="px-4 py-3 text-foreground">{p.quantity} un.</td>
                        <td className="px-4 py-3 text-foreground">{p.totalSold}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{p.turnover}x</td>
                        <td className="px-4 py-3 text-foreground">{p.daysOfStock >= 999 ? "∞" : `${p.daysOfStock} dias`}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${status.class}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
