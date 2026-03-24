import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Search,
  Plus, Minus, RotateCcw, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Boxes,
} from "lucide-react";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setMovements((movRes.data as StockMovement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lowStockCount = useMemo(() => products.filter((p) => p.quantity <= p.low_stock_threshold && p.quantity > 0).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.quantity === 0).length, [products]);
  const totalStock = useMemo(() => products.reduce((s, p) => s + p.quantity, 0), [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (filter === "low") result = result.filter((p) => p.quantity <= p.low_stock_threshold && p.quantity > 0);
    if (filter === "out") result = result.filter((p) => p.quantity === 0);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }
    return result;
  }, [products, filter, search]);

  async function handleAdjust() {
    if (!adjustProduct || adjustQty <= 0 || !user) return;
    setSaving(true);

    const prod = products.find((p) => p.id === adjustProduct);
    if (!prod) { setSaving(false); return; }

    const delta = adjustType === "out" ? -adjustQty : adjustQty;
    const newStock = Math.max(0, prod.quantity + delta);

    await supabase.from("stock_movements").insert({
      product_id: adjustProduct,
      type: adjustType,
      quantity: adjustQty,
      previous_stock: prod.quantity,
      new_stock: newStock,
      reason: adjustReason || null,
      created_by: user.id,
    });

    await supabase.from("products").update({ quantity: newStock }).eq("id", adjustProduct);

    setAdjustProduct(null);
    setAdjustQty(1);
    setAdjustReason("");
    setSaving(false);
    fetchData();
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Estoque</h1>
        <p className="text-muted-foreground mt-1">Controle de inventário em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "all" ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total em estoque</p>
            <p className="text-xl font-extrabold text-foreground">{totalStock}</p>
          </div>
        </button>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Produtos</p>
            <p className="text-xl font-extrabold text-foreground">{products.length}</p>
          </div>
        </div>
        <button
          onClick={() => setFilter("low")}
          className={`bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "low" ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/10" : ""}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Estoque baixo</p>
            <p className="text-xl font-extrabold text-amber-600">{lowStockCount}</p>
          </div>
        </button>
        <button
          onClick={() => setFilter("out")}
          className={`bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${filter === "out" ? "ring-2 ring-destructive shadow-lg shadow-destructive/10" : ""}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-destructive/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Sem estoque</p>
            <p className="text-xl font-extrabold text-destructive">{outOfStockCount}</p>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>

      {/* Adjustment modal */}
      <AnimatePresence>
        {adjustProduct && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-supet-bg-alt rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-foreground">
                Ajustar estoque: {products.find((p) => p.id === adjustProduct)?.title}
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2">
                  {(["in", "out", "adjustment"] as const).map((t) => {
                    const cfg = typeConfig[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setAdjustType(t)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                          adjustType === t ? "bg-primary text-primary-foreground shadow-md" : "bg-supet-bg text-muted-foreground"
                        }`}
                      >
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-20 px-3 py-2.5 rounded-2xl bg-supet-bg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="flex-1 min-w-[150px] px-4 py-2.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleAdjust}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Confirmar"}
                </button>
                <button onClick={() => setAdjustProduct(null)} className="px-4 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-supet-bg-alt rounded-3xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-border" />
                <div className="h-3 w-24 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-supet-bg-alt rounded-3xl p-10 text-center text-muted-foreground text-sm">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prod, i) => {
            const isExpanded = expandedId === prod.id;
            const isLow = prod.quantity <= prod.low_stock_threshold && prod.quantity > 0;
            const isOut = prod.quantity === 0;
            const prodMovements = movements.filter((m) => m.product_id === prod.id).slice(0, 10);

            return (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-supet-bg-alt rounded-3xl overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{prod.title}</p>
                    <p className="text-xs text-muted-foreground">R$ {prod.price.toFixed(2)}</p>
                  </div>

                  {/* Stock indicator */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                    isOut ? "bg-destructive/15 text-destructive" : isLow ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"
                  }`}>
                    {isOut && <AlertTriangle className="w-3 h-3" />}
                    {prod.quantity} un.
                  </div>

                  <button
                    onClick={() => setAdjustProduct(prod.id)}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />Ajustar
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : prod.id)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/50">
                        <div className="flex items-center justify-between pt-3 mb-3">
                          <p className="text-xs font-semibold text-muted-foreground">Histórico de movimentações</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Alerta: ≤ {prod.low_stock_threshold} un.</span>
                          </div>
                        </div>
                        {prodMovements.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">Sem movimentações registradas</p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {prodMovements.map((mov) => {
                              const cfg = typeConfig[mov.type] || typeConfig.adjustment;
                              const MIcon = cfg.icon;
                              return (
                                <div key={mov.id} className="flex items-center gap-3 p-2.5 bg-supet-bg rounded-2xl">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.class}`}>
                                    <MIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground">
                                      {cfg.label} — {mov.quantity} un.
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {mov.previous_stock} → {mov.new_stock}
                                      {mov.reason ? ` · ${mov.reason}` : ""}
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {new Date(mov.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
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
    </AdminLayout>
  );
}
