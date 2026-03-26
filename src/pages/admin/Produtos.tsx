import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, ImageIcon, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

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

export default function AdminProdutos() {
  const [products, setProducts] = useState<any[]>([]);
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

  useEffect(() => { fetchProducts(); }, [page, sortCol, sortDir, searchQuery]);
  useEffect(() => { setPage(0); }, [searchQuery]);

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
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      price_per_unit: form.price_per_unit || null,
      quantity: Number(form.quantity),
      badge: form.badge || null,
      category: form.category,
      active: form.active,
      highlighted: form.highlighted,
      image_url: form.image_url || null,
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
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    log({ action: "delete", entity_type: "product", entity_id: deleteTarget.id, details: { title: deleteTarget.name } });
    setDeleteTarget(null);
    fetchProducts();
  };

  const activeCount = products.filter(p => p.active).length;
  const inactiveCount = products.filter(p => !p.active).length;
  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  const showingLabel = totalCount > 0 ? ` (${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount})` : "";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground font-display">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            {!loading && <>{activeCount} ativo{activeCount !== 1 ? "s" : ""}{inactiveCount > 0 && <> · {inactiveCount} inativo{inactiveCount !== 1 ? "s" : ""}</>}</>}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openNew}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
          <Plus className="w-4 h-4" /> Novo Produto
        </motion.button>
      </div>

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
                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Título *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {/* Subtitle */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Subtítulo</label>
                  <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                    placeholder="Descrição detalhada do produto..."
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                {/* Price row */}
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
                {/* Price per unit */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Preço por Unidade</label>
                  <input value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })}
                    placeholder="Ex: R$ 149,90/pote"
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {/* Quantity + Category */}
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
                {/* Badge */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Badge</label>
                  <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Ex: Mais Vendido"
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {/* Toggles */}
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
