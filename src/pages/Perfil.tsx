import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Package, Shield, User, Phone, Loader2, CheckCircle2, Lock, Mail, PawPrint, MapPin, Bell, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import PetProfileTab from "@/components/profile/PetProfileTab";
import AddressesTab from "@/components/profile/AddressesTab";
import OrdersTab from "@/components/profile/OrdersTab";
import RestockRemindersTab from "@/components/profile/RestockRemindersTab";
import TreatmentDiaryTab from "@/components/profile/TreatmentDiaryTab";

export default function Perfil() {
  const { user, isLoading: authLoading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setAvatarUrl(data.avatar_url || null);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado com sucesso!");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").remove([path]);
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl);
    setUploading(false);
    toast.success("Avatar atualizado!");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) toast.error("Erro ao enviar e-mail de redefinição");
    else { setPasswordResetSent(true); toast.success("E-mail de redefinição enviado!"); }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <section className="relative min-h-screen bg-supet-bg py-10 px-4 overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-110" />
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="relative h-24 w-24 rounded-full object-cover border-4 border-primary/30" />
            ) : (
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-supet-bg-alt border-4 border-primary/30 text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">{fullName || "Meu Perfil"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </motion.div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full rounded-full bg-supet-bg-alt p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="dados" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <User className="h-3.5 w-3.5" /> Dados
            </TabsTrigger>
            <TabsTrigger value="pet" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <PawPrint className="h-3.5 w-3.5" /> Meu Pet
            </TabsTrigger>
            <TabsTrigger value="enderecos" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5" /> Endereços
            </TabsTrigger>
            <TabsTrigger value="compras" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <Package className="h-3.5 w-3.5" /> Compras
            </TabsTrigger>
            <TabsTrigger value="lembretes" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <Bell className="h-3.5 w-3.5" /> Reposição
            </TabsTrigger>
            <TabsTrigger value="diario" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <BookOpen className="h-3.5 w-3.5" /> Diário
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 text-xs">
              <Shield className="h-3.5 w-3.5" /> Segurança
            </TabsTrigger>
          </TabsList>

          {/* Meus Dados */}
          <TabsContent value="dados">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-primary" /> Nome completo
                </label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="Seu nome" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Phone className="h-4 w-4 text-primary" /> Telefone
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="(00) 00000-0000" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </motion.div>
          </TabsContent>

          {/* Meu Pet */}
          <TabsContent value="pet">
            <PetProfileTab />
          </TabsContent>

          {/* Endereços */}
          <TabsContent value="enderecos">
            <AddressesTab />
          </TabsContent>

          {/* Compras */}
          <TabsContent value="compras">
            <OrdersTab />
          </TabsContent>

          {/* Lembretes de Reposição */}
          <TabsContent value="lembretes">
            <RestockRemindersTab />
          </TabsContent>

          {/* Diário de Tratamento */}
          <TabsContent value="diario">
            <TreatmentDiaryTab />
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" /> E-mail
                </label>
                <input value={user.email || ""} readOnly className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-muted-foreground outline-none ring-1 ring-border cursor-not-allowed" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-primary" /> Senha
                </label>
                <p className="text-sm text-muted-foreground mb-3">Enviaremos um link para seu e-mail para redefinir a senha.</p>
                <button onClick={handleResetPassword} disabled={passwordResetSent} className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {passwordResetSent ? <><CheckCircle2 className="h-4 w-4" /> E-mail enviado</> : <><Lock className="h-4 w-4" /> Redefinir senha</>}
                </button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
