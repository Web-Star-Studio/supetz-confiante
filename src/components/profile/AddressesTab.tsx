import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MapPin, Plus, Trash2, Star, Loader2, CheckCircle2, Search } from "lucide-react";

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

const EMPTY_ADDRESS: Partial<Address> = {
  label: "Casa",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  is_default: false,
};

function AddressSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-border" />
              <div className="h-4 w-16 rounded-full bg-border" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-7 w-14 rounded-full bg-border" />
              <div className="h-7 w-7 rounded-full bg-border" />
            </div>
          </div>
          <div className="h-3.5 w-3/4 rounded-full bg-border mt-3" />
          <div className="h-3.5 w-1/2 rounded-full bg-border mt-2" />
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmation({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="rounded-3xl bg-supet-bg-alt p-6 max-w-sm w-full shadow-xl">
        <p className="text-base font-bold text-foreground mb-1">Remover endereço?</p>
        <p className="text-sm text-muted-foreground mb-5">Essa ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-supet-bg py-2.5 text-sm font-bold text-foreground hover:bg-border transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors">
            Remover
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AddressesTab() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing({ ...EMPTY_ADDRESS });
    setIsNew(true);
  };

  const handleEdit = (addr: Address) => {
    setEditing({ ...addr });
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  const fetchCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
      } else {
        setEditing((p) => p ? {
          ...p,
          street: data.logradouro || p.street || "",
          neighborhood: data.bairro || p.neighborhood || "",
          city: data.localidade || p.city || "",
          state: data.uf || p.state || "",
        } : p);
        toast.success("Endereço preenchido pelo CEP!");
      }
    } catch {
      toast.error("Erro ao consultar CEP");
    }
    setCepLoading(false);
  }, []);

  const handleCepChange = (value: string) => {
    // Format CEP as 00000-000
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setEditing((p) => p ? { ...p, zip: formatted } : p);
    if (digits.length === 8) fetchCep(digits);
  };

  const handleSave = async () => {
    if (!editing?.street?.trim() || !editing?.number?.trim() || !user) return;
    setSaving(true);

    if (editing.is_default) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    if (isNew) {
      const { error } = await supabase.from("user_addresses").insert({
        user_id: user.id,
        label: editing.label || "Casa",
        street: editing.street,
        number: editing.number,
        complement: editing.complement || null,
        neighborhood: editing.neighborhood || "",
        city: editing.city || "",
        state: editing.state || "",
        zip: editing.zip || "",
        is_default: editing.is_default || false,
      });
      if (error) toast.error("Erro ao adicionar endereço");
      else toast.success("Endereço adicionado!");
    } else {
      const { error } = await supabase
        .from("user_addresses")
        .update({
          label: editing.label || "Casa",
          street: editing.street,
          number: editing.number,
          complement: editing.complement || null,
          neighborhood: editing.neighborhood || "",
          city: editing.city || "",
          state: editing.state || "",
          zip: editing.zip || "",
          is_default: editing.is_default || false,
        })
        .eq("id", editing.id!);
      if (error) toast.error("Erro ao atualizar endereço");
      else toast.success("Endereço atualizado!");
    }

    setSaving(false);
    setEditing(null);
    setIsNew(false);
    loadAddresses();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("user_addresses").delete().eq("id", deleteTarget);
    if (error) toast.error("Erro ao remover endereço");
    else {
      toast.success("Endereço removido");
      loadAddresses();
    }
    setDeleteTarget(null);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Endereço padrão atualizado");
    loadAddresses();
  };

  const field = (label: string, key: keyof Address, placeholder: string, half = false, disabled = false) => (
    <div className={half ? "" : "col-span-2"}>
      <label className="mb-1.5 text-sm font-semibold text-foreground">{label}</label>
      <input
        value={(editing?.[key] as string) || ""}
        onChange={(e) => setEditing((p) => p ? { ...p, [key]: e.target.value } : p)}
        disabled={disabled}
        className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder={placeholder}
      />
    </div>
  );

  if (loading) return <AddressSkeleton />;

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field("Apelido", "label", "Ex: Casa, Trabalho", true)}

          {/* CEP with auto-fill */}
          <div>
            <label className="mb-1.5 text-sm font-semibold text-foreground">CEP</label>
            <div className="relative">
              <input
                value={editing.zip || ""}
                onChange={(e) => handleCepChange(e.target.value)}
                className="w-full rounded-full bg-supet-bg px-4 py-2.5 pr-10 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                placeholder="00000-000"
                maxLength={9}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cepLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {field("Rua", "street", "Nome da rua")}
          {field("Número", "number", "123", true)}
          {field("Complemento", "complement", "Apto, bloco...", true)}
          {field("Bairro", "neighborhood", "Bairro", true)}
          {field("Cidade", "city", "Cidade", true)}
          {field("Estado", "state", "UF", true)}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={editing.is_default || false}
            onChange={(e) => setEditing((p) => p ? { ...p, is_default: e.target.checked } : p)}
            className="rounded accent-primary"
          />
          Definir como endereço padrão
        </label>

        <div className="flex gap-3">
          <button onClick={handleCancel} className="flex-1 rounded-full bg-supet-bg py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editing.street?.trim() || !editing.number?.trim()}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {deleteTarget && <DeleteConfirmation onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
        {addresses.length === 0 ? (
          <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
            <MapPin className="mx-auto h-12 w-12 text-primary/40 mb-3" />
            <p className="text-lg font-semibold text-foreground">Nenhum endereço salvo</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um endereço para agilizar suas compras.</p>
          </div>
        ) : (
          addresses.map((addr, i) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-bold text-foreground">{addr.label}</span>
                  {addr.is_default && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Padrão</span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)} className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Definir como padrão">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleEdit(addr)} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => setDeleteTarget(addr.id)} className="rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-foreground/80">
                {addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {addr.neighborhood} · {addr.city}/{addr.state} · {addr.zip}
              </p>
            </motion.div>
          ))
        )}

        <button
          onClick={handleAdd}
          className="w-full rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-bold text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar endereço
        </button>
      </motion.div>
    </>
  );
}