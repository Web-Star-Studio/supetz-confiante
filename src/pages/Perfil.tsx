import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Package, Shield, ShoppingBag, Lock, Mail, User, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface OrderItem {
  title?: string;
  quantity?: number;
  price?: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
  customer_name: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default function Perfil() {
  const { user, isLoading: authLoading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadOrders();
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

  const loadOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total, items, customer_name")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    // Remove old avatar
    await supabase.storage.from("avatars").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("user_id", user.id);

    setAvatarUrl(newUrl);
    setUploading(false);
    toast.success("Avatar atualizado!");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) {
      toast.error("Erro ao enviar e-mail de redefinição");
    } else {
      setPasswordResetSent(true);
      toast.success("E-mail de redefinição enviado!");
    }
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
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          {/* Avatar */}
          <div className="relative mx-auto mb-4 h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-110" />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="relative h-24 w-24 rounded-full object-cover border-4 border-primary/30"
              />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            {fullName || "Meu Perfil"}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </motion.div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full rounded-full bg-supet-bg-alt p-1">
            <TabsTrigger value="dados" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs sm:text-sm">
              <User className="h-4 w-4" /> Meus Dados
            </TabsTrigger>
            <TabsTrigger value="compras" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs sm:text-sm">
              <Package className="h-4 w-4" /> Compras
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs sm:text-sm">
              <Shield className="h-4 w-4" /> Segurança
            </TabsTrigger>
          </TabsList>

          {/* Meus Dados */}
          <TabsContent value="dados">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5"
            >
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-primary" /> Nome completo
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Phone className="h-4 w-4 text-primary" /> Telefone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </motion.div>
          </TabsContent>

          {/* Minhas Compras */}
          <TabsContent value="compras">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-primary/40 mb-3" />
                  <p className="text-lg font-semibold text-foreground">Nenhuma compra ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">Quando você fizer um pedido, ele aparecerá aqui.</p>
                </div>
              ) : (
                orders.map((order, i) => {
                  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-sm font-mono text-muted-foreground/60 mt-0.5">
                            #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-foreground/80">
                        {items.slice(0, 3).map((item, j) => (
                          <p key={j}>
                            {item.quantity || 1}x {item.title || "Produto"}
                          </p>
                        ))}
                        {items.length > 3 && (
                          <p className="text-muted-foreground">+{items.length - 3} itens</p>
                        )}
                      </div>
                      <div className="mt-3 border-t border-border/50 pt-3 text-right">
                        <span className="text-lg font-bold text-primary">
                          R$ {Number(order.total).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5"
            >
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" /> E-mail
                </label>
                <input
                  value={user.email || ""}
                  readOnly
                  className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-muted-foreground outline-none ring-1 ring-border cursor-not-allowed"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-primary" /> Senha
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Enviaremos um link para seu e-mail para redefinir a senha.
                </p>
                <button
                  onClick={handleResetPassword}
                  disabled={passwordResetSent}
                  className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordResetSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> E-mail enviado
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Redefinir senha
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
