import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, X, Loader2, ImageIcon, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, BarChart3, TrendingUp, Star,
  Package, DollarSign, Eye, ShoppingCart, Copy, ToggleLeft, Download,
  AlertTriangle, Crown, Percent, Tag
} from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell,
  ResponsiveContainer, LineChart, Line, Tooltip, Legend
} from "recharts";

const PAGE_SIZE = 12;

type ProdSortCol = "created_at" | "price" | "quantity" | "title";
type ProdSortDir = "asc" | "desc";

interface ProductForm {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  original_price: string;
  price_per_unit: string;
  quantity: string;
  badge: string;
  category: string;
  active: boolean;
  highlighted: boolean;
  image_url: string;
}

const CATEGORIES = [
  { value: "combo", label: "Combo" },
  { value: "extra", label: "Extra" },
  { value: "acessorio", label: "Acessório" },
  { value: "higiene", label: "Higiene" },
  { value: "brinquedo", label: "Brinquedo" },
  { value: "alimentacao", label: "Alimentação" },
];

const emptyForm: ProductForm = {
  title: "", subtitle: "", description: "", price: "", original_price: "",
  price_per_unit: "", quantity: "1", badge: "", category: "combo",
  active: true, highlighted: false, image_url: "",
};

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"
];

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-3xl p-6 animate-pulse">
          <div className="w-full h-36 rounded-2xl bg-border mb-4" />
          <div className="h-4 w-3/4 rounded-full bg-border mb-2" />
          <div className="h-3 w-1/2 rounded-full bg-border mb-4" />
          <div className="h-6 w-24 rounded-full bg-border" />
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmation({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-muted rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold text-foreground mb-1">Excluir "{name}"?</p>
        <p className="text-sm text-muted-foreground mb-5">O produto será removido permanentemente do catálogo.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-card py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors">Excluir</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── KPI Card ─── */
function KPICard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl bg-${color}/10`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-extrabold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminProdutos() {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const { log } = useAuditLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortCol, setSortCol] = useState<ProdSortCol>("created_at");
  const [sortDir, setSortDir] = useState<ProdSortDir>("desc");
  const [activeTab, setActiveTab] = useState("catalogo");

  // Analytics data
  const [reviews, setReviews] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  const toggleSort = (col: ProdSortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
    setPage(0);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from("products").select("*", { count: "exact" }).order(sortCol, { ascending: sortDir === "asc" }).range(from, to);
    if (searchQuery.trim()) query = query.or(`title.ilike.%${searchQuery.trim()}%,subtitle.ilike.%${searchQuery.trim()}%,category.ilike.%${searchQuery.trim()}%`);
    const { data, count } = await query;
    setProducts(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const fetchAllProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: true });
    setAllProducts(data || []);
  };

  const fetchAnalyticsData = async () => {
    const [reviewsRes, salesRes] = await Promise.all([
      supabase.from("product_reviews").select("product_id, rating, created_at"),
      supabase.from("stock_movements").select("product_id, quantity, type, created_at").eq("type", "sale"),
    ]);
    setReviews(reviewsRes.data || []);
    setSales(salesRes.data || []);
  };

  useEffect(() => { fetchProducts(); }, [page, sortCol, sortDir, searchQuery]);
  useEffect(() => { setPage(0); }, [searchQuery]);
  useEffect(() => {
    fetchAllProducts();
    fetchAnalyticsData();
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({
      title: p.title, subtitle: p.subtitle || "", description: p.description || "",
      price: String(p.price), original_price: String(p.original_price || ""),
      price_per_unit: p.price_per_unit || "", quantity: String(p.quantity),
      badge: p.badge || "", category: p.category || "combo",
      active: p.active ?? true, highlighted: p.highlighted ?? false,
      image_url: p.image_url || "",
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: form.title, subtitle: form.subtitle || null, description: form.description || null,
      price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null,
      price_per_unit: form.price_per_unit || null, quantity: Number(form.quantity),
      badge: form.badge || null, category: form.category,
      active: form.active, highlighted: form.highlighted, image_url: form.image_url || null,
    };
    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing);
      log({ action: "update", entity_type: "product", entity_id: editing, details: { title: form.title } });
    } else {
      const { data } = await supabase.from("products").insert(payload).select().single();
      if (data) log({ action: "create", entity_type: "product", entity_id: data.id, details: { title: form.title } });
    }
    setSaving(false);
    setShowModal(false);
    fetchProducts();
    fetchAllProducts();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    log({ action: "delete", entity_type: "product", entity_id: deleteTarget.id, details: { title: deleteTarget.name } });
    setDeleteTarget(null);
    fetchProducts();
    fetchAllProducts();
  };

  // ── Bulk actions ──
  const toggleBulkSelect = (id: string) => {
    setSelectedBulk(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedBulk.size === products.length) setSelectedBulk(new Set());
    else setSelectedBulk(new Set(products.map(p => p.id)));
  };

  const executeBulkAction = async () => {
    if (!selectedBulk.size || !bulkAction) return;
    const ids = Array.from(selectedBulk);
    if (bulkAction === "activate") {
      await supabase.from("products").update({ active: true }).in("id", ids);
      log({ action: "update", entity_type: "product", details: { bulk: "activate", count: ids.length } });
    } else if (bulkAction === "deactivate") {
      await supabase.from("products").update({ active: false }).in("id", ids);
      log({ action: "update", entity_type: "product", details: { bulk: "deactivate", count: ids.length } });
    } else if (bulkAction === "highlight") {
      await supabase.from("products").update({ highlighted: true }).in("id", ids);
      log({ action: "update", entity_type: "product", details: { bulk: "highlight", count: ids.length } });
    } else if (bulkAction === "unhighlight") {
      await supabase.from("products").update({ highlighted: false }).in("id", ids);
      log({ action: "update", entity_type: "product", details: { bulk: "unhighlight", count: ids.length } });
    } else if (bulkAction === "delete") {
      await supabase.from("products").delete().in("id", ids);
      log({ action: "delete", entity_type: "product", details: { bulk: "delete", count: ids.length } });
    }
    setSelectedBulk(new Set());
    setBulkAction("");
    fetchProducts();
    fetchAllProducts();
  };

  const exportCSV = () => {
    const headers = ["Título", "Categoria", "Preço", "Preço Original", "Estoque", "Ativo", "Destaque", "Badge"];
    const rows = allProducts.map(p => [
      p.title, p.category || "", Number(p.price).toFixed(2), p.original_price ? Number(p.original_price).toFixed(2) : "",
      p.quantity, p.active ? "Sim" : "Não", p.highlighted ? "Sim" : "Não", p.badge || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `produtos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    log({ action: "export", entity_type: "product", details: { count: allProducts.length } });
  };

  // ── Analytics computations ──
  const categoryDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allProducts.forEach(p => {
      const cat = CATEGORIES.find(c => c.value === p.category)?.label || p.category || "Sem categoria";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allProducts]);

  const priceDistribution = useMemo(() => {
    const ranges = [
      { label: "R$ 0-50", min: 0, max: 50 },
      { label: "R$ 50-100", min: 50, max: 100 },
      { label: "R$ 100-200", min: 100, max: 200 },
      { label: "R$ 200-500", min: 200, max: 500 },
      { label: "R$ 500+", min: 500, max: Infinity },
    ];
    return ranges.map(r => ({
      name: r.label,
      count: allProducts.filter(p => Number(p.price) >= r.min && Number(p.price) < r.max).length,
    }));
  }, [allProducts]);

  const stockValue = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
  }, [allProducts]);

  const avgPrice = useMemo(() => {
    if (!allProducts.length) return 0;
    return allProducts.reduce((s, p) => s + Number(p.price), 0) / allProducts.length;
  }, [allProducts]);

  const avgDiscount = useMemo(() => {
    const withDiscount = allProducts.filter(p => p.original_price && Number(p.original_price) > Number(p.price));
    if (!withDiscount.length) return 0;
    return withDiscount.reduce((s, p) => s + ((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100, 0) / withDiscount.length;
  }, [allProducts]);

  // ── Performance: reviews + sales per product ──
  const productPerformance = useMemo(() => {
    const map: Record<string, { title: string; avgRating: number; reviewCount: number; salesQty: number; revenue: number; price: number }> = {};

    allProducts.forEach(p => {
      map[p.id] = { title: p.title, avgRating: 0, reviewCount: 0, salesQty: 0, revenue: 0, price: Number(p.price) };
    });

    reviews.forEach(r => {
      if (map[r.product_id]) {
        map[r.product_id].reviewCount++;
        map[r.product_id].avgRating += r.rating;
      }
    });

    sales.forEach(s => {
      if (map[s.product_id]) {
        map[s.product_id].salesQty += s.quantity;
        map[s.product_id].revenue += s.quantity * map[s.product_id].price;
      }
    });

    return Object.entries(map).map(([id, v]) => ({
      id,
      title: v.title,
      avgRating: v.reviewCount > 0 ? v.avgRating / v.reviewCount : 0,
      reviewCount: v.reviewCount,
      salesQty: v.salesQty,
      revenue: v.revenue,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [allProducts, reviews, sales]);

  const topSellers = productPerformance.slice(0, 10);
  const topRated = [...productPerformance].filter(p => p.reviewCount > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);

  // Health alerts
  const healthAlerts = useMemo(() => {
    const alerts: { type: string; message: string; severity: "warning" | "danger" | "info" }[] = [];
    const noImage = allProducts.filter(p => !p.image_url && p.active);
    if (noImage.length) alerts.push({ type: "image", message: `${noImage.length} produto(s) ativo(s) sem imagem`, severity: "warning" });
    const noDesc = allProducts.filter(p => !p.description && p.active);
    if (noDesc.length) alerts.push({ type: "desc", message: `${noDesc.length} produto(s) ativo(s) sem descrição`, severity: "info" });
    const lowStock = allProducts.filter(p => p.active && p.quantity <= (p.low_stock_threshold || 5));
    if (lowStock.length) alerts.push({ type: "stock", message: `${lowStock.length} produto(s) com estoque baixo`, severity: "danger" });
    const noDiscount = allProducts.filter(p => p.active && (!p.original_price || Number(p.original_price) <= Number(p.price)));
    if (noDiscount.length > allProducts.length * 0.5) alerts.push({ type: "price", message: `${noDiscount.length} produto(s) sem desconto configurado`, severity: "info" });
    const noBadge = allProducts.filter(p => p.active && !p.badge);
    if (noBadge.length > 3) alerts.push({ type: "badge", message: `${noBadge.length} produto(s) sem badge/selo`, severity: "info" });
    return alerts;
  }, [allProducts]);

  const activeCount = products.filter(p => p.active).length;
  const inactiveCount = products.filter(p => !p.active).length;
  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  const chartConfig = {
    count: { label: "Quantidade", color: "hsl(var(--primary))" },
    revenue: { label: "Receita", color: "hsl(var(--primary))" },
    rating: { label: "Nota", color: "#f59e0b" },
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            {!loading && <>{allProducts.filter(p => p.active).length} ativo{allProducts.filter(p => p.active).length !== 1 ? "s" : ""} · {allProducts.length} total</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-card text-foreground font-bold text-sm hover:bg-primary/10 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openNew}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
            <Plus className="w-4 h-4" /> Novo Produto
          </motion.button>
        </div>
      </div>

      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {healthAlerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-medium ${
              alert.severity === "danger" ? "bg-destructive/10 text-destructive" :
              alert.severity === "warning" ? "bg-amber-500/10 text-amber-700" :
              "bg-primary/10 text-primary"
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-card/80 backdrop-blur rounded-2xl p-1 flex-wrap">
          <TabsTrigger value="catalogo" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4 mr-1.5" /> Catálogo
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="w-4 h-4 mr-1.5" /> Performance
          </TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Copy className="w-4 h-4 mr-1.5" /> Ações em Massa
          </TabsTrigger>
        </TabsList>

        {/* ─── CATÁLOGO TAB ─── */}
        <TabsContent value="catalogo">
          {/* Search + Sort controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, subtítulo ou categoria..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Ordenar:</span>
              {([
                { col: "created_at" as ProdSortCol, label: "Data" },
                { col: "price" as ProdSortCol, label: "Preço" },
                { col: "quantity" as ProdSortCol, label: "Estoque" },
                { col: "title" as ProdSortCol, label: "Nome" },
              ]).map(({ col, label }) => (
                <button key={col} onClick={() => toggleSort(col)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${sortCol === col ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                  {label}
                  {sortCol === col ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          {loading ? <ProductsSkeleton /> : products.length === 0 ? (
            <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhum produto cadastrado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map(p => (
                <motion.div key={p.id} whileHover={{ y: -2 }} className="bg-card rounded-3xl p-6 flex flex-col">
                  {p.image_url && (
                    <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 bg-muted">
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">{p.title}</h3>
                      {p.subtitle && <p className="text-muted-foreground text-xs mt-0.5">{p.subtitle}</p>}
                    </div>
                    {p.badge && <span className="text-xs font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{p.badge}</span>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-extrabold text-foreground">R$ {Number(p.price).toFixed(2)}</span>
                    {p.original_price && <span className="text-sm text-muted-foreground line-through">R$ {Number(p.original_price).toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {categoryLabel(p.category)}
                    </span>
                    {p.highlighted && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Destaque</span>
                    )}
                    <span className="text-xs text-muted-foreground">Qtd: {p.quantity}</span>
                  </div>
                  <div className="flex gap-1 mt-auto">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ id: p.id, name: p.title })} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-sm text-muted-foreground">{page + 1} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-card text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </TabsContent>

        {/* ─── ANALYTICS TAB ─── */}
        <TabsContent value="analytics">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard icon={Package} label="Total Produtos" value={String(allProducts.length)} sub={`${allProducts.filter(p => p.active).length} ativos`} />
            <KPICard icon={DollarSign} label="Valor em Estoque" value={`R$ ${stockValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="primary" />
            <KPICard icon={Tag} label="Preço Médio" value={`R$ ${avgPrice.toFixed(2)}`} color="primary" />
            <KPICard icon={Percent} label="Desconto Médio" value={`${avgDiscount.toFixed(1)}%`} sub="produtos com desconto" color="primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category distribution */}
            <div className="bg-card rounded-3xl p-6">
              <h3 className="font-bold text-foreground mb-4">Distribuição por Categoria</h3>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Price distribution */}
            <div className="bg-card rounded-3xl p-6">
              <h3 className="font-bold text-foreground mb-4">Faixa de Preço</h3>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={priceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Stock by category */}
            <div className="bg-card rounded-3xl p-6 lg:col-span-2">
              <h3 className="font-bold text-foreground mb-4">Valor de Estoque por Categoria</h3>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={
                  CATEGORIES.map(c => ({
                    name: c.label,
                    revenue: allProducts.filter(p => p.category === c.value).reduce((s, p) => s + Number(p.price) * p.quantity, 0)
                  })).filter(c => c.revenue > 0)
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>

        {/* ─── PERFORMANCE TAB ─── */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top sellers */}
            <div className="bg-card rounded-3xl p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Mais Vendidos
              </h3>
              {topSellers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
              ) : (
                <div className="space-y-3">
                  {topSellers.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        i === 0 ? "bg-amber-500/20 text-amber-600" :
                        i === 1 ? "bg-muted text-muted-foreground" :
                        i === 2 ? "bg-orange-500/20 text-orange-600" :
                        "bg-muted text-muted-foreground"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.salesQty} vendas</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">R$ {p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top rated */}
            <div className="bg-card rounded-3xl p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Melhor Avaliados
              </h3>
              {topRated.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>
              ) : (
                <div className="space-y-3">
                  {topRated.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold bg-amber-500/20 text-amber-600">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.reviewCount} avaliações</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-foreground">{p.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue per product chart */}
            <div className="bg-card rounded-3xl p-6 lg:col-span-2">
              <h3 className="font-bold text-foreground mb-4">Receita por Produto (Top 10)</h3>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={topSellers.map(p => ({ name: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title, revenue: p.revenue }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${v}`} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>

        {/* ─── BULK ACTIONS TAB ─── */}
        <TabsContent value="bulk">
          <div className="bg-card rounded-3xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button onClick={selectAll} className="px-4 py-2 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-primary/10 transition-colors">
                  {selectedBulk.size === products.length ? "Desmarcar Todos" : "Selecionar Todos"}
                </button>
                <span className="text-sm text-muted-foreground">{selectedBulk.size} selecionado(s)</span>
              </div>
              {selectedBulk.size > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                    <option value="">Escolher ação...</option>
                    <option value="activate">✅ Ativar</option>
                    <option value="deactivate">🚫 Desativar</option>
                    <option value="highlight">⭐ Destacar</option>
                    <option value="unhighlight">💤 Remover destaque</option>
                    <option value="delete">🗑️ Excluir</option>
                  </select>
                  <button onClick={executeBulkAction} disabled={!bulkAction}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
                    Aplicar
                  </button>
                </div>
              )}
            </div>

            {/* Product list with checkboxes */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {products.map(p => (
                <div key={p.id} onClick={() => toggleBulkSelect(p.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${
                    selectedBulk.has(p.id) ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted hover:bg-muted/80"
                  }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selectedBulk.has(p.id) ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {selectedBulk.has(p.id) && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                  </div>
                  {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(p.category)} · R$ {Number(p.price).toFixed(2)} · Qtd: {p.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                    {p.highlighted && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">★</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination in bulk tab */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-muted text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-sm text-muted-foreground">{page + 1} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-muted text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-primary/10 transition-colors">
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {deleteTarget && <DeleteConfirmation name={deleteTarget.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-muted rounded-3xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-foreground font-display">{editing ? "Editar Produto" : "Novo Produto"}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                {/* Image */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Imagem</label>
                  {form.image_url ? (
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-card mb-2">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 right-2 p-1 rounded-full bg-muted/80 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl bg-card cursor-pointer hover:bg-primary/5 transition-colors">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
                        <>
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Título *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Subtítulo</label>
                  <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                    placeholder="Descrição detalhada do produto..."
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Preço *</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Preço Original</label>
                    <input type="number" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Preço por Unidade</label>
                  <input value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })}
                    placeholder="Ex: R$ 149,90/pote"
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Estoque</label>
                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Categoria</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Badge</label>
                  <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Ex: Mais Vendido"
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                      className={`w-12 h-7 rounded-full transition-colors relative ${form.active ? "bg-primary" : "bg-muted"}`}>
                      <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-1 transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm font-medium text-foreground">{form.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setForm({ ...form, highlighted: !form.highlighted })}
                      className={`w-12 h-7 rounded-full transition-colors relative ${form.highlighted ? "bg-amber-500" : "bg-muted"}`}>
                      <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-1 transition-transform ${form.highlighted ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm font-medium text-foreground">Destaque</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-full bg-card text-foreground font-semibold text-sm hover:bg-primary/10 transition-colors">Cancelar</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || !form.title || !form.price}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-primary/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Salvar" : "Criar"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
