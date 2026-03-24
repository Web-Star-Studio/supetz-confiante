import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera, Package, Shield, User, Phone, Loader2, CheckCircle2, Lock, Mail,
  PawPrint, MapPin, Bell, BookOpen, Star, Ticket, LogOut, ChevronRight, ChevronLeft, Store, Menu, X,
  Sparkles, Trophy, LayoutDashboard, PanelLeftClose, PanelLeftOpen,
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
import ProfileDashboardTab from "@/components/profile/ProfileDashboardTab";
import UserNotificationCenter from "@/components/profile/UserNotificationCenter";
import Header from "@/components/layout/Header";

const navItems = [
  { key: "dashboard", label: "Resumo", icon: LayoutDashboard },
  { key: "dados", label: "Meus Dados", icon: User },
  { key: "pet", label: "Meu Pet", icon: PawPrint },
  { key: "ia", label: "SuperPet AI", icon: Sparkles },
  { key: "conquistas", label: "Conquistas", icon: Trophy },
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

  const [activeTab, setActiveTab] = useState("dashboard");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const sidebarContent = (
    <>
      <div className="relative p-3 lg:p-4 xl:p-5 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <Link to="/" className="relative z-10">
          <img
            src="/supetNewLogo.svg"
            alt="Supet"
            className={`transition-all duration-300 ${sidebarCollapsed ? "h-5 sm:h-6 w-auto" : "h-12 sm:h-14 lg:h-16 xl:h-20 w-auto"}`}
          />
        </Link>
      </div>

      {!sidebarCollapsed && (
        <div className="px-4 lg:px-6 pb-3 lg:pb-4 text-center">
          {avatarBlock}
          <h2 className="text-base font-bold text-foreground font-display truncate">{fullName || "Meu Perfil"}</h2>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      )}

      {sidebarCollapsed && (
        <div className="flex justify-center pb-3">
          <div className="relative h-10 w-10">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-supet-bg border-2 border-primary/30 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 p-1.5 lg:p-2 xl:p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setMobileSidebarOpen(false); }}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex w-full items-center gap-2 lg:gap-3 rounded-2xl text-xs lg:text-sm font-semibold transition-all ${
                sidebarCollapsed ? "justify-center px-2 py-2.5 lg:py-3" : "px-3 lg:px-4 py-2.5 lg:py-3"
              } ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <item.icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              {!sidebarCollapsed && item.label}
              {!sidebarCollapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </nav>

      <div className="p-1.5 lg:p-2 xl:p-3">
        <button
          onClick={handleSignOut}
          title={sidebarCollapsed ? "Sair" : undefined}
          className={`flex items-center gap-2 w-full rounded-2xl text-xs lg:text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors ${
            sidebarCollapsed ? "justify-center px-2 py-2 lg:py-2.5" : "px-3 lg:px-4 py-2 lg:py-2.5"
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && "Sair"}
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ProfileDashboardTab setActiveTab={setActiveTab} />;
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
      case "ia": return <AIPetAssistantTab />;
      case "conquistas": return <AchievementsTab />;
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
      <div className="lg:hidden">
        <Header />
      </div>

      <div className="min-h-screen bg-supet-bg flex">
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}

        <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-supet-bg-alt z-50 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-72"
        } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-5 right-4 lg:hidden text-muted-foreground hover:text-foreground z-10">
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center rounded-full bg-supet-bg-alt border border-border/50 shadow-md hover:bg-primary/10 hover:border-primary/30 transition-all group z-50"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </button>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
          {/* Desktop top bar with notification center */}
          <header className="hidden lg:flex sticky top-0 z-30 bg-supet-bg/80 backdrop-blur-xl px-6 py-4 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              <Store className="w-4 h-4" />
              Voltar à loja
            </Link>
            <div className="ml-auto flex items-center gap-3">
              {currentNavItem && (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <currentNavItem.icon className="w-4 h-4" />
                  {currentNavItem.label}
                </span>
              )}
              <UserNotificationCenter />
            </div>
          </header>

          {/* Mobile: avatar + tabs */}
          <div className="lg:hidden">
            <div className="pt-3 pb-1 px-4 flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-supet-bg-alt border-2 border-primary/30 text-sm font-bold text-primary">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  {uploading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Camera className="h-2.5 w-2.5" />}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground font-display truncate">{fullName || "Meu Perfil"}</h1>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <UserNotificationCenter />
            </div>
            <div className="overflow-x-auto px-3 pb-3 pt-2 scrollbar-hide scroll-snap-x">
              <div className="w-max min-w-full rounded-full bg-supet-bg-alt p-1 flex gap-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`rounded-full px-3 py-2 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                      activeTab === item.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="flex-1 p-3 md:p-6 lg:p-10">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Footer hidden on mobile — bottom nav handles it */}
    </>
  );
}
