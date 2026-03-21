import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";

export default function AdminConfiguracoes() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configurações da conta de administrador</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Account Info */}
        <div className="bg-card rounded-3xl border border-border p-6">
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
        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4 font-display">Alterar Senha</h2>
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-2xl p-3 mb-4 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Senha atualizada com sucesso!
            </div>
          )}
          {error && <div className="bg-destructive/10 text-destructive rounded-2xl p-3 mb-4 text-sm font-medium">{error}</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Nova senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
            </motion.button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
