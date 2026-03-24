import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Store } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function AdminConfiguracoes() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Store settings
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [savingStore, setSavingStore] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from("store_settings").select("*");
      if (data) {
        data.forEach((s: any) => {
          if (s.key === "store_name") setStoreName((s.value as any)?.value || "");
          if (s.key === "store_phone") setStorePhone((s.value as any)?.value || "");
          if (s.key === "store_address") setStoreAddress((s.value as any)?.value || "");
        });
      }
    }
    loadSettings();
  }, []);

  const handleSaveStore = async () => {
    setSavingStore(true);
    setStoreSuccess(false);
    const settings = [
      { key: "store_name", value: { value: storeName } },
      { key: "store_phone", value: { value: storePhone } },
      { key: "store_address", value: { value: storeAddress } },
    ];
    for (const s of settings) {
      await supabase.from("store_settings").upsert(s, { onConflict: "key" });
    }
    setSavingStore(false);
    setStoreSuccess(true);
    setTimeout(() => setStoreSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword.length < 6) { setError("Mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError("Erro ao atualizar senha.");
    else { setSuccess(true); setNewPassword(""); }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configurações da conta e da loja</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Store Settings */}
        <div className="bg-supet-bg-alt rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground font-display">Dados da Loja</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Nome da Loja</label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Supet" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Telefone</label>
              <input value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Endereço</label>
              <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Rua..." className={inputClass} />
            </div>
            {storeSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-2xl p-3 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Configurações salvas!
              </div>
            )}
            <motion.button onClick={handleSaveStore} disabled={savingStore} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-primary/20">
              {savingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </motion.button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-supet-bg-alt rounded-3xl p-6">
          <h2 className="font-bold text-foreground mb-4 font-display">Informações da Conta</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">E-mail</label>
              <p className="text-sm font-semibold text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">ID</label>
              <p className="text-xs font-mono text-muted-foreground">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-supet-bg-alt rounded-3xl p-6">
          <h2 className="font-bold text-foreground mb-4 font-display">Alterar Senha</h2>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-2xl p-3 mb-4 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Senha atualizada com sucesso!
            </div>
          )}
          {error && <div className="bg-destructive/10 text-destructive rounded-2xl p-3 mb-4 text-sm font-medium">{error}</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Nova senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
            </motion.button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
