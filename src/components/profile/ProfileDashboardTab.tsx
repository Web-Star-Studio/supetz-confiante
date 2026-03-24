import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package, Star, Ticket, Bell, PawPrint, BookOpen, ShoppingBag,
  Sparkles, Trophy, ChevronRight, Calendar, TrendingUp, Store, BarChart3,
  AlertCircle, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

interface ProfileDashboardTabProps {
  setActiveTab: (tab: string) => void;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ProfileDashboardTab({ setActiveTab }: ProfileDashboardTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ordersCount: number;
    lastOrder: any;
    totalPoints: number;
    activeCoupons: number;
    pendingReminders: number;
    nextReminder: any;
    pets: any[];
    lastDiary: any;
    notifications: any[];
    treatmentChart: { month: string; registros: number }[];
    pointsChart: { month: string; pontos: number }[];
    aiExpiry: { expiresAt: Date; daysLeft: number } | null;
  }>({
    ordersCount: 0, lastOrder: null, totalPoints: 0, activeCoupons: 0,
    pendingReminders: 0, nextReminder: null, pets: [], lastDiary: null, notifications: [],
    treatmentChart: [], pointsChart: [], aiExpiry: null,
  });

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);

    const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

    const [ordersRes, pointsRes, couponsRes, remindersRes, petRes, diaryRes, notifRes, treatmentLogsRes, pointsHistRes, aiCreditsRes] = await Promise.all([
      supabase.from("orders").select("id, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("loyalty_points").select("points").eq("user_id", user.id),
      supabase.from("user_coupons").select("id").eq("user_id", user.id).eq("used", false).gte("expires_at", new Date().toISOString()),
      supabase.from("restock_reminders").select("id, product_title, estimated_end_date").eq("user_id", user.id).eq("reminded", false).order("estimated_end_date", { ascending: true }),
      supabase.from("pets").select("name, breed, weight_kg, photo_url").eq("user_id", user.id),
      supabase.from("treatment_logs").select("log_date, notes").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("user_notifications").select("id, title, message, type, created_at, read").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(3),
      supabase.from("treatment_logs").select("log_date").eq("user_id", user.id).gte("log_date", sixMonthsAgo.split("T")[0]),
      supabase.from("loyalty_points").select("points, created_at").eq("user_id", user.id).gte("created_at", sixMonthsAgo),
      supabase.from("ai_access_credits").select("expires_at").eq("user_id", user.id).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const orders = ordersRes.data || [];
    const totalPoints = (pointsRes.data || []).reduce((sum, p) => sum + p.points, 0);
    const reminders = remindersRes.data || [];

    // Group treatment logs by month
    const treatmentByMonth: Record<string, number> = {};
    (treatmentLogsRes.data || []).forEach((log) => {
      const key = format(new Date(log.log_date), "MMM/yy", { locale: ptBR });
      treatmentByMonth[key] = (treatmentByMonth[key] || 0) + 1;
    });

    // Group points by month
    const pointsByMonth: Record<string, number> = {};
    (pointsHistRes.data || []).forEach((p) => {
      const key = format(new Date(p.created_at), "MMM/yy", { locale: ptBR });
      pointsByMonth[key] = (pointsByMonth[key] || 0) + p.points;
    });

    // Build ordered arrays for last 6 months
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(format(subMonths(new Date(), i), "MMM/yy", { locale: ptBR }));
    }
    const treatmentChart = months.map((m) => ({ month: m, registros: treatmentByMonth[m] || 0 }));
    const pointsChart = months.map((m) => ({ month: m, pontos: pointsByMonth[m] || 0 }));

    // AI access expiry
    let aiExpiry: { expiresAt: Date; daysLeft: number } | null = null;
    if (aiCreditsRes.data?.expires_at) {
      const expiresAt = new Date(aiCreditsRes.data.expires_at);
      const daysLeft = differenceInDays(expiresAt, new Date());
      if (daysLeft >= 0 && daysLeft <= 7) {
        aiExpiry = { expiresAt, daysLeft };
      }
    }

    setData({
      ordersCount: orders.length,
      lastOrder: orders[0] || null,
      totalPoints,
      activeCoupons: (couponsRes.data || []).length,
      pendingReminders: reminders.length,
      nextReminder: reminders[0] || null,
      pets: petRes.data || [],
      lastDiary: diaryRes.data,
      notifications: notifRes.data || [],
      treatmentChart,
      pointsChart,
      aiExpiry,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-supet-bg-alt p-5 animate-pulse">
              <div className="h-4 w-16 bg-border rounded-full mb-3" />
              <div className="h-7 w-12 bg-border rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-supet-bg-alt p-6 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Pedidos", value: data.ordersCount, icon: Package, color: "text-blue-500 bg-blue-500/10", tab: "compras" },
    { label: "Pontos", value: data.totalPoints, icon: Star, color: "text-yellow-500 bg-yellow-500/10", tab: "pontos" },
    { label: "Cupons", value: data.activeCoupons, icon: Ticket, color: "text-green-500 bg-green-500/10", tab: "cupons" },
    { label: "Reposições", value: data.pendingReminders, icon: Bell, color: "text-orange-500 bg-orange-500/10", tab: "lembretes" },
  ];

  const quickActions = [
    { label: "Loja", icon: Store, href: "/shop", tab: null },
    { label: "Super IA", icon: Sparkles, tab: "ia", href: null },
    { label: "Conquistas", icon: Trophy, tab: "conquistas", href: null },
    { label: "Meu Pet", icon: PawPrint, tab: "pet", href: null },
    { label: "Diário", icon: BookOpen, tab: "diario", href: null },
    { label: "Compras", icon: ShoppingBag, tab: "compras", href: null },
  ];

  const cardClass = "rounded-2xl bg-supet-bg-alt p-4 sm:p-5 md:p-6 overflow-hidden";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* AI Access Expiry Warning */}
      {data.aiExpiry && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 ${
            data.aiExpiry.daysLeft <= 2
              ? "bg-destructive/10 border border-destructive/20"
              : "bg-amber-500/10 border border-amber-500/20"
          }`}
        >
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            data.aiExpiry.daysLeft <= 2 ? "bg-destructive/15" : "bg-amber-500/15"
          }`}>
            {data.aiExpiry.daysLeft <= 2
              ? <AlertCircle className="h-4.5 w-4.5 text-destructive" />
              : <Clock className="h-4.5 w-4.5 text-amber-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${data.aiExpiry.daysLeft <= 2 ? "text-destructive" : "text-amber-700 dark:text-amber-400"}`}>
              {data.aiExpiry.daysLeft === 0
                ? "Super IA expira hoje!"
                : data.aiExpiry.daysLeft === 1
                  ? "Super IA expira amanhã!"
                  : `Super IA expira em ${data.aiExpiry.daysLeft} dias`
              }
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seu acesso ao assistente inteligente expira em {format(data.aiExpiry.expiresAt, "dd/MM/yyyy")}. Faça uma nova compra para renovar automaticamente.
            </p>
            <button
              onClick={() => setActiveTab("ia")}
              className={`mt-2.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                data.aiExpiry.daysLeft <= 2
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              Usar agora
            </button>
          </div>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={() => setActiveTab(m.tab)}
            className={`${cardClass} text-left hover:ring-2 hover:ring-primary/20 transition-all group`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{m.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${m.color}`}>
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{m.value}</p>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Evolução do Tratamento</h3>
          </div>
          {data.treatmentChart.some((d) => d.registros > 0) ? (
            <ChartContainer config={{ registros: { label: "Registros", color: "hsl(var(--primary))" } }} className="h-[180px] w-full">
              <AreaChart data={data.treatmentChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="registros" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BookOpen className="w-8 h-8 opacity-40" />
              <p className="text-sm">Sem registros ainda</p>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Histórico de Pontos</h3>
          </div>
          {data.pointsChart.some((d) => d.pontos > 0) ? (
            <ChartContainer config={{ pontos: { label: "Pontos", color: "hsl(var(--chart-2))" } }} className="h-[180px] w-full">
              <BarChart data={data.pointsChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pontos" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BarChart3 className="w-8 h-8 opacity-40" />
              <p className="text-sm">Sem pontos ainda</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pet Summary */}
        <button onClick={() => setActiveTab("pet")} className={`${cardClass} text-left hover:ring-2 hover:ring-primary/20 transition-all`}>
          <div className="flex items-center gap-2 mb-3">
            <PawPrint className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Meus Pets</h3>
          </div>
          {data.pets.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {data.pets.map((pet, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-2xl bg-supet-bg px-3 py-2.5 min-w-0">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <PawPrint className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{pet.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[pet.breed, pet.weight_kg && `${pet.weight_kg}kg`].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pet cadastrado. Toque para adicionar!</p>
          )}
        </button>

        {/* Last Order */}
        <button onClick={() => setActiveTab("compras")} className={`${cardClass} text-left hover:ring-2 hover:ring-primary/20 transition-all`}>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Último Pedido</h3>
          </div>
          {data.lastOrder ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[data.lastOrder.status] || "bg-muted text-muted-foreground"}`}>
                  {statusLabels[data.lastOrder.status] || data.lastOrder.status}
                </span>
                <span className="text-sm font-bold text-foreground">
                  R$ {Number(data.lastOrder.total).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(data.lastOrder.created_at), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          )}
        </button>

        {/* Next Restock */}
        <button onClick={() => setActiveTab("lembretes")} className={`${cardClass} text-left hover:ring-2 hover:ring-primary/20 transition-all`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Próxima Reposição</h3>
          </div>
          {data.nextReminder ? (
            <div>
              <p className="font-semibold text-foreground text-sm">{data.nextReminder.product_title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(data.nextReminder.estimated_end_date), "dd/MM/yyyy")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum lembrete ativo.</p>
          )}
        </button>

        {/* Treatment Diary */}
        <button onClick={() => setActiveTab("diario")} className={`${cardClass} text-left hover:ring-2 hover:ring-primary/20 transition-all`}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Diário de Tratamento</h3>
          </div>
          {data.lastDiary ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {format(new Date(data.lastDiary.log_date), "dd/MM/yyyy")}
              </p>
              <p className="text-sm text-foreground line-clamp-2">{data.lastDiary.notes || "Sem anotações"}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
          )}
        </button>
      </div>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Notificações recentes</h3>
          </div>
          <div className="space-y-2">
            {data.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-supet-bg">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-foreground mb-3">Ações rápidas</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickActions.map((a) =>
            a.href ? (
              <Link
                key={a.label}
                to={a.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{a.label}</span>
              </Link>
            ) : (
              <button
                key={a.label}
                onClick={() => a.tab && setActiveTab(a.tab)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{a.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
