import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Bell, BellOff, Clock, Loader2, Plus, Trash2, AlertTriangle, CheckCircle2, Package } from "lucide-react";

interface Pet { id: string; name: string; weight_kg: number | null; }
interface Reminder { id: string; product_title: string; purchased_at: string; estimated_end_date: string; reminded: boolean; pet_id: string | null; }

function estimateDuration(weightKg: number | null): number {
  if (!weightKg || weightKg <= 0) return 30;
  const mlPerDay = Math.max(0.5, weightKg / 5);
  return Math.max(7, Math.round(30 / mlPerDay));
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr); const now = new Date();
  target.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statusInfo(daysLeft: number) {
  if (daysLeft <= 0) return { label: "Esgotado", color: "bg-red-100 text-red-800", icon: AlertTriangle };
  if (daysLeft <= 5) return { label: `${daysLeft} dias restantes`, color: "bg-yellow-100 text-yellow-800", icon: Clock };
  if (daysLeft <= 10) return { label: `${daysLeft} dias restantes`, color: "bg-blue-100 text-blue-800", icon: Clock };
  return { label: `${daysLeft} dias restantes`, color: "bg-green-100 text-green-800", icon: CheckCircle2 };
}

function ReminderSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {[1].map((i) => (
        <div key={i} className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2"><div className="h-4 w-28 rounded-full bg-border" /><div className="h-3 w-16 rounded-full bg-border" /></div>
            <div className="h-6 w-28 rounded-full bg-border" />
          </div>
          <div className="h-2 rounded-full bg-border mb-2" />
          <div className="flex justify-between"><div className="h-3 w-32 rounded-full bg-border" /><div className="h-3 w-24 rounded-full bg-border" /></div>
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmation({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="rounded-3xl bg-supet-bg-alt p-6 max-w-sm w-full shadow-xl">
        <p className="text-base font-bold text-foreground mb-1">Remover lembrete?</p>
        <p className="text-sm text-muted-foreground mb-5">Essa ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-supet-bg py-2.5 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors">Remover</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RestockRemindersTab() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [newProductTitle, setNewProductTitle] = useState("Supet Spray");
  const [newPetId, setNewPetId] = useState<string>("");
  const [newPurchasedAt, setNewPurchasedAt] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { if (user) { loadReminders(); loadPets(); } }, [user]);

  const loadReminders = async () => {
    setLoading(true);
    const { data } = await supabase.from("restock_reminders").select("*").eq("user_id", user!.id).order("estimated_end_date", { ascending: true });
    setReminders((data as Reminder[]) || []);
    setLoading(false);
  };

  const loadPets = async () => {
    const { data } = await supabase.from("pets").select("id, name, weight_kg").eq("user_id", user!.id);
    setPets((data as Pet[]) || []);
  };

  const handleAdd = () => { setAdding(true); setNewProductTitle("Supet Spray"); setNewPurchasedAt(new Date().toISOString().split("T")[0]); setNewPetId(pets.length > 0 ? pets[0].id : ""); };

  const handleSave = async () => {
    if (!user || !newProductTitle.trim()) return;
    setSaving(true);
    const selectedPet = pets.find((p) => p.id === newPetId);
    const durationDays = estimateDuration(selectedPet?.weight_kg || null);
    const endDate = new Date(newPurchasedAt);
    endDate.setDate(endDate.getDate() + durationDays);
    const { error } = await supabase.from("restock_reminders").insert({ user_id: user.id, pet_id: newPetId || null, product_title: newProductTitle, purchased_at: newPurchasedAt, estimated_end_date: endDate.toISOString().split("T")[0] });
    setSaving(false);
    if (error) toast.error("Erro ao criar lembrete");
    else { toast.success(`Lembrete criado! Duração estimada: ${durationDays} dias`); setAdding(false); loadReminders(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("restock_reminders").delete().eq("id", deleteTarget);
    if (error) toast.error("Erro ao remover lembrete"); else { toast.success("Lembrete removido"); loadReminders(); }
    setDeleteTarget(null);
  };

  if (loading) return <ReminderSkeleton />;

  if (adding) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground">Produto</label>
          <input value={newProductTitle} onChange={(e) => setNewProductTitle(e.target.value)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="Nome do produto" />
        </div>
        {pets.length > 0 && (
          <div>
            <label className="mb-1.5 text-sm font-semibold text-foreground">Pet (para cálculo de duração)</label>
            <select value={newPetId} onChange={(e) => setNewPetId(e.target.value)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
              <option value="">Sem pet vinculado</option>
              {pets.map((p) => <option key={p.id} value={p.id}>{p.name} {p.weight_kg ? `(${p.weight_kg}kg)` : ""}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground">Data da compra</label>
          <input type="date" value={newPurchasedAt} onChange={(e) => setNewPurchasedAt(e.target.value)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
        </div>
        {newPetId && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-sm text-foreground">
            <p className="font-semibold text-primary mb-1">📊 Estimativa inteligente</p>
            <p>Com base no peso de <strong>{pets.find((p) => p.id === newPetId)?.weight_kg || "?"} kg</strong>, o produto deve durar aproximadamente <strong>{estimateDuration(pets.find((p) => p.id === newPetId)?.weight_kg || null)} dias</strong>.</p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setAdding(false)} className="flex-1 rounded-full bg-supet-bg py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !newProductTitle.trim()} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            {saving ? "Criando..." : "Criar lembrete"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {deleteTarget && <DeleteConfirmation onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
        {reminders.length === 0 ? (
          <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
            <BellOff className="mx-auto h-12 w-12 text-primary/40 mb-3" />
            <p className="text-lg font-semibold text-foreground">Nenhum lembrete ativo</p>
            <p className="text-sm text-muted-foreground mt-1">Crie um lembrete para saber quando repor o produto do seu pet.</p>
          </div>
        ) : (
          reminders.map((r, i) => {
            const days = daysUntil(r.estimated_end_date);
            const status = statusInfo(days);
            const StatusIcon = status.icon;
            const pet = pets.find((p) => p.id === r.pet_id);
            const progress = (() => {
              const start = new Date(r.purchased_at).getTime();
              const end = new Date(r.estimated_end_date).getTime();
              const now = Date.now();
              if (end <= start) return 100;
              return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
            })();
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> {r.product_title}</p>
                    {pet && <p className="text-xs text-muted-foreground mt-0.5">Para {pet.name}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 ${status.color}`}><StatusIcon className="h-3 w-3" /> {status.label}</span>
                    <button onClick={() => setDeleteTarget(r.id)} className="rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-border overflow-hidden mb-2">
                  <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${days <= 0 ? "bg-destructive" : days <= 5 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Comprado em {new Date(r.purchased_at).toLocaleDateString("pt-BR")}</span>
                  <span>Fim: {new Date(r.estimated_end_date).toLocaleDateString("pt-BR")}</span>
                </div>
              </motion.div>
            );
          })
        )}
        <button onClick={handleAdd} className="w-full rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-bold text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Novo lembrete de reposição
        </button>
      </motion.div>
    </>
  );
}