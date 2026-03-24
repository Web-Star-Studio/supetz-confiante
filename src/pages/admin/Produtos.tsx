import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, ImageIcon } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

interface ProductForm {
  title: string;
  subtitle: string;
  price: string;
  original_price: string;
  quantity: string;
  badge: string;
  category: string;
  active: boolean;
  image_url: string;
}

const emptyForm: ProductForm = { title: "", subtitle: "", price: "", original_price: "", quantity: "1", badge: "", category: "combo", active: true, image_url: "" };

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-supet-bg-alt rounded-3xl p-6 animate-pulse">
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
      className="fixed inset-0 bg-supet-text/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-supet-bg rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold text-foreground mb-1">Excluir "{name}"?</p>
        <p className="text-sm text-muted-foreground mb-5">O produto será removido permanentemente do catálogo.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-supet-bg-alt py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors">Excluir</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminProdutos() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({
      title: p.title, subtitle: p.subtitle || "", price: String(p.price), original_price: String(p.original_price || ""),
      quantity: String(p.quantity), badge: p.badge || "", category: p.category || "combo", active: p.active ?? true,
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
      title: form.title, subtitle: form.subtitle || null, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null,
      quantity: Number(form.quantity), badge: form.badge || null, category: form.category, active: form.active,
      image_url: form.image_url || null,
    };
    if (editing) await supabase.from("products").update(payload).eq("id", editing);
    else await supabase.from("products").insert(payload);
    setSaving(false);
    setShowModal(false);
    fetchProducts();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchProducts();
  };

  const activeCount = products.filter(p => p.active).length;
  const inactiveCount = products.filter(p => !p.active).length;

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

      {loading ? <ProductsSkeleton /> : products.length === 0 ? (
        <div className="bg-supet-bg-alt rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhum produto cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <motion.div key={p.id} whileHover={{ y: -2 }} className="bg-supet-bg-alt rounded-3xl p-6 flex flex-col">
              {p.image_url && (
                <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 bg-supet-bg">
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
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-extrabold text-foreground">R$ {Number(p.price).toFixed(2)}</span>
                {p.original_price && <span className="text-sm text-muted-foreground line-through">R$ {Number(p.original_price).toFixed(2)}</span>}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {p.active ? "Ativo" : "Inativo"}
                </span>
                <span className="text-xs text-muted-foreground">Qtd: {p.quantity}</span>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: p.id, name: p.title })} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && <DeleteConfirmation name={deleteTarget.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-supet-text/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-supet-bg rounded-3xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-foreground font-display">{editing ? "Editar Produto" : "Novo Produto"}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Imagem</label>
                  {form.image_url ? (
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-supet-bg-alt mb-2">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 right-2 p-1 rounded-full bg-supet-bg/80 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl bg-supet-bg-alt cursor-pointer hover:bg-primary/5 transition-colors">
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
                    className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Subtítulo</label>
                  <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Preço *</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Preço Original</label>
                    <input type="number" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Quantidade</label>
                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Categoria</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                      <option value="combo">Combo</option>
                      <option value="extra">Extra</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Badge</label>
                  <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Ex: Mais Vendido"
                    className="w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                    className={`w-12 h-7 rounded-full transition-colors relative ${form.active ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-1 transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm font-medium text-foreground">{form.active ? "Ativo" : "Inativo"}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-full bg-supet-bg-alt text-foreground font-semibold text-sm hover:bg-primary/10 transition-colors">Cancelar</button>
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