import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera, Package, Shield, User, Phone, Loader2, CheckCircle2, Lock, Mail,
  PawPrint, MapPin, Bell, BookOpen, Star, Ticket, LogOut, ChevronRight, Store, Menu, X,
  Sparkles, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import PetProfileTab from "@/components/profile/PetProfileTab";
import AddressesTab from "@/components/profile/AddressesTab";
import OrdersTab from "@/components/profile/OrdersTab";
import RestockRemindersTab from "@/components/profile/RestockRemindersTab";
import TreatmentDiaryTab from "@/components/profile/TreatmentDiaryTab";
import LoyaltyPointsTab from "@/components/profile/LoyaltyPointsTab";
import CouponsTab from "@/components/profile/CouponsTab";
import AIPetAssistantTab from "@/components/profile/AIPetAssistantTab";
import AchievementsTab from "@/components/profile/AchievementsTab";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const navItems = [
  { key: "dados", label: "Meus Dados", icon: User },
  { key: "pet", label: "Meu Pet", icon: PawPrint },
  { key: "enderecos", label: "Endereços", icon: MapPin },
  { key: "compras", label: "Compras", icon: Package },
  { key: "lembretes", label: "Reposição", icon: Bell },
  { key: "diario", label: "Diário", icon: BookOpen },
  { key: "pontos", label: "Pontos", icon: Star },
  { key: "cupons", label: "Cupons", icon: Ticket },
  { key: "seguranca", label: "Segurança", icon: Shield },
];

export default function Perfil() {
  const { user, isLoading: authLoading, resetPassword, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("dados");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || !user) {
    return (
      <section className="relative min-h-screen bg-supet-bg py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 rounded-full bg-supet-bg-alt animate-pulse" />
            <div className="h-5 w-40 rounded-full bg-supet-bg-alt animate-pulse" />
            <div className="h-3 w-52 rounded-full bg-supet-bg-alt animate-pulse" />
          </div>
          <div className="h-10 rounded-full bg-supet-bg-alt animate-pulse" />
          <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
            <div className="h-4 w-1/3 rounded-full bg-border animate-pulse" />
            <div className="h-10 w-full rounded-full bg-border animate-pulse" />
            <div className="h-4 w-1/4 rounded-full bg-border animate-pulse" />
            <div className="h-10 w-full rounded-full bg-border animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  const currentNavItem = navItems.find((i) => i.key === activeTab);

  // Shared avatar block
  const avatarBlock = (
    <div className="relative mx-auto mb-3 h-20 w-20">
      <div className="absolute inset-0 rounded-full bg-primary/20 scale-110" />
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="relative h-20 w-20 rounded-full object-cover border-4 border-primary/30" />
      ) : (
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-supet-bg-alt border-4 border-primary/30 text-xl font-bold text-primary">
          {initials}
        </div>
      )}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
    </div>
  );

  // Sidebar content (shared between desktop sticky and mobile overlay)
  const sidebarContent = (
    <>
      {/* Logo + back */}
      <div className="relative p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <Link to="/" className="flex items-center gap-2 relative z-10 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          <Store className="w-4 h-4" />
          Voltar à loja
        </Link>
      </div>

      {/* Avatar + info */}
      <div className="px-6 pb-4 text-center">
        {avatarBlock}
        <h2 className="text-base font-bold text-foreground font-display truncate">{fullName || "Meu Perfil"}</h2>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setMobileSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </>
  );

  // Active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "dados":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
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
              <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="(00) 00000-0000" />
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </motion.div>
        );
      case "pet": return <PetProfileTab />;
      case "enderecos": return <AddressesTab />;
      case "compras": return <OrdersTab />;
      case "lembretes": return <RestockRemindersTab />;
      case "diario": return <TreatmentDiaryTab />;
      case "pontos": return <LoyaltyPointsTab />;
      case "cupons": return <CouponsTab />;
      case "seguranca":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
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
        );
      default: return null;
    }
  };

  return (
    <>
      {/* Mobile: show site header */}
      <div className="lg:hidden">
        <Header />
      </div>

      <div className="min-h-screen bg-supet-bg flex">
        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* Sidebar — desktop: sticky, mobile: overlay */}
        <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-supet-bg-alt z-50 flex flex-col transition-transform duration-300 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          {/* Mobile close */}
          <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-5 right-4 lg:hidden text-muted-foreground hover:text-foreground z-10">
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Desktop top bar */}
          <header className="hidden lg:flex sticky top-0 z-30 bg-supet-bg/80 backdrop-blur-xl px-6 py-4 items-center gap-3">
            <img src="/supetNewLogo.svg" alt="Supet" className="h-7" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-primary/15 text-primary px-2.5 py-1 rounded-full">Minha Conta</span>
            <div className="ml-auto flex items-center gap-2">
              {currentNavItem && (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <currentNavItem.icon className="w-4 h-4" />
                  {currentNavItem.label}
                </span>
              )}
            </div>
          </header>

          {/* Mobile: avatar + tabs */}
          <div className="lg:hidden">
            <div className="pt-6 pb-2 px-4 text-center">
              {avatarBlock}
              <h1 className="text-xl font-bold text-foreground font-display">{fullName || "Meu Perfil"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="overflow-x-auto px-4 pb-4 scrollbar-hide">
              <div className="w-max min-w-full rounded-full bg-supet-bg-alt p-1 flex gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                      activeTab === item.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content area */}
          <main className="flex-1 p-4 md:p-6 lg:p-10">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile: show footer */}
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
