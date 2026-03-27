import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Ticket, Users, TrendingUp, Plus, Loader2, Search, Gift, Trash2,
  Crown, Medal, Award, ShieldCheck, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Zap, Target, UserX, Copy, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PointsEntry {
  id: string;
  user_id: string;
  points: number;
  source: string;
  description: string | null;
  created_at: string;
}

interface CouponEntry {
  id: string;
  user_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  used: boolean;
  expires_at: string | null;
  created_at: string;
}

interface ProfileInfo {
  user_id: string;
  full_name: string | null;
}

interface OrderInfo {
  id: string;
  user_id: string;
  total: number;
  created_at: string;
  items: any;
}

const COLORS = ["hsl(27, 100%, 49%)", "hsl(27, 100%, 70%)", "hsl(28, 38%, 75%)", "hsl(25, 20%, 60%)", "#6366f1", "#06b6d4"];

const TIERS = [
  { name: "Diamante", min: 5000, icon: Crown, color: "text-cyan-500", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  { name: "Ouro", min: 2000, icon: Crown, color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  { name: "Prata", min: 500, icon: Medal, color: "text-slate-400", bg: "bg-slate-400/15", border: "border-slate-400/30" },
  { name: "Bronze", min: 0, icon: Award, color: "text-orange-700", bg: "bg-orange-700/15", border: "border-orange-700/30" },
];

function getTier(totalPoints: number) {
  return TIERS.find((t) => totalPoints >= t.min) || TIERS[TIERS.length - 1];
}

export default function Fidelizacao() {
  const [loading, setLoading] = useState(true);
  const { log } = useAuditLog();
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [coupons, setCoupons] = useState<CouponEntry[]>([]);
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [orders, setOrders] = useState<OrderInfo[]>([]);

  // Forms
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ userId: "", code: "", discountType: "percentage", discountValue: 10, minOrder: 0, expiresInDays: 30 });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [newPoints, setNewPoints] = useState({ userId: "", points: 100, description: "Bônus manual" });
  const [savingPoints, setSavingPoints] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkCoupon, setBulkCoupon] = useState({ prefix: "FIDELIDADE", discountType: "percentage", discountValue: 10, minOrder: 50, expiresInDays: 30, targetTier: "all" });
  const [savingBulk, setSavingBulk] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pointsRes, couponsRes, profilesRes, ordersRes] = await Promise.all([
      supabase.from("loyalty_points").select("*").order("created_at", { ascending: false }),
      supabase.from("user_coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("orders").select("id, user_id, total, created_at, items").neq("status", "cancelled"),
    ]);
    setPoints((pointsRes.data as PointsEntry[]) || []);
    setCoupons((couponsRes.data as CouponEntry[]) || []);
    setProfiles((profilesRes.data as ProfileInfo[]) || []);
    setOrders((ordersRes.data as OrderInfo[]) || []);
    setLoading(false);
  };

  const getName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.full_name || userId.slice(0, 8) + "...";
  };

  // === METRICS ===
  const totalPointsIssued = useMemo(() => points.reduce((s, p) => s + (p.points > 0 ? p.points : 0), 0), [points]);
  const totalPointsRedeemed = useMemo(() => points.reduce((s, p) => s + (p.points < 0 ? Math.abs(p.points) : 0), 0), [points]);
  const activeCoupons = useMemo(() => coupons.filter((c) => !c.used && (!c.expires_at || new Date(c.expires_at) >= new Date())), [coupons]);
  const usedCoupons = useMemo(() => coupons.filter((c) => c.used), [coupons]);
  const uniqueUsers = useMemo(() => new Set(points.map((p) => p.user_id)).size, [points]);
  const couponUsageRate = coupons.length > 0 ? Math.round((usedCoupons.length / coupons.length) * 100) : 0;

  // === USER RANKINGS ===
  const userRankings = useMemo(() => {
    const userMap: Record<string, { userId: string; totalPoints: number; totalSpent: number; ordersCount: number; lastActivity: string }> = {};
    
    points.forEach((p) => {
      if (!userMap[p.user_id]) {
        userMap[p.user_id] = { userId: p.user_id, totalPoints: 0, totalSpent: 0, ordersCount: 0, lastActivity: p.created_at };
      }
      userMap[p.user_id].totalPoints += p.points;
      if (p.created_at > userMap[p.user_id].lastActivity) userMap[p.user_id].lastActivity = p.created_at;
    });

    orders.forEach((o) => {
      if (!userMap[o.user_id]) {
        userMap[o.user_id] = { userId: o.user_id, totalPoints: 0, totalSpent: 0, ordersCount: 0, lastActivity: o.created_at };
      }
      userMap[o.user_id].totalSpent += Number(o.total);
      userMap[o.user_id].ordersCount += 1;
    });

    return Object.values(userMap)
      .map((u) => ({ ...u, tier: getTier(u.totalPoints) }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [points, orders]);

  // Tier distribution
  const tierDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    userRankings.forEach((u) => {
      dist[u.tier.name] = (dist[u.tier.name] || 0) + 1;
    });
    return TIERS.map((t) => ({ name: t.name, value: dist[t.name] || 0, color: t.color.replace("text-", "") }));
  }, [userRankings]);

  // === CHURN RISK ===
  const churnRisk = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    return userRankings
      .filter((u) => u.lastActivity < thirtyDaysAgo && u.totalPoints > 50)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);
  }, [userRankings]);

  // === COUPON ROI ===
  const couponROI = useMemo(() => {
    const usedCouponCodes = usedCoupons.map((c) => c.code);
    // Estimate: orders that used a coupon code (check items metadata)
    let revenueFromCoupons = 0;
    let totalDiscount = 0;

    usedCoupons.forEach((c) => {
      totalDiscount += c.discount_type === "percentage"
        ? 0 // We'd need order total to calculate actual discount
        : c.discount_value;
    });

    // Approximate: each used coupon = avg order value
    const avgOrder = orders.length > 0 ? orders.reduce((s, o) => s + Number(o.total), 0) / orders.length : 0;
    revenueFromCoupons = usedCoupons.length * avgOrder;

    // For percentage coupons, estimate discount
    usedCoupons.forEach((c) => {
      if (c.discount_type === "percentage") {
        totalDiscount += (avgOrder * c.discount_value) / 100;
      }
    });

    return {
      revenue: Math.round(revenueFromCoupons * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      roi: totalDiscount > 0 ? Math.round(((revenueFromCoupons - totalDiscount) / totalDiscount) * 100) : 0,
    };
  }, [usedCoupons, orders]);

  // === POINTS TREND (last 30 days) ===
  const pointsTrend = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });
    return days.map((day) => ({
      day: day.slice(5),
      emitidos: points.filter((p) => p.created_at.startsWith(day) && p.points > 0).reduce((s, p) => s + p.points, 0),
      resgatados: points.filter((p) => p.created_at.startsWith(day) && p.points < 0).reduce((s, p) => s + Math.abs(p.points), 0),
    }));
  }, [points]);

  // Source chart
  const sourceChartData = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    points.forEach((p) => {
      if (p.points > 0) sourceMap[p.source] = (sourceMap[p.source] || 0) + p.points;
    });
    return Object.entries(sourceMap).map(([name, value]) => ({
      name: name === "purchase" ? "Compras" : name === "bonus" ? "Bônus" : name === "referral" ? "Indicação" : name,
      value,
    }));
  }, [points]);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // === HANDLERS ===
  const handleCreateCoupon = async () => {
    if (!newCoupon.userId || !newCoupon.code) { toast.error("Preencha todos os campos"); return; }
    setSavingCoupon(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + newCoupon.expiresInDays);
    const { error } = await supabase.from("user_coupons").insert({
      user_id: newCoupon.userId, code: newCoupon.code.toUpperCase(),
      discount_type: newCoupon.discountType, discount_value: newCoupon.discountValue,
      min_order_value: newCoupon.minOrder, expires_at: expiresAt.toISOString(),
    });
    setSavingCoupon(false);
    if (error) toast.error("Erro ao criar cupom");
    else { toast.success("Cupom criado!"); log({ action: "create", entity_type: "coupon", details: { code: newCoupon.code } }); setShowCouponForm(false); loadData(); }
  };

  const handleAddPoints = async () => {
    if (!newPoints.userId) { toast.error("Selecione um usuário"); return; }
    setSavingPoints(true);
    const { error } = await supabase.from("loyalty_points").insert({
      user_id: newPoints.userId, points: newPoints.points, source: "bonus", description: newPoints.description,
    });
    setSavingPoints(false);
    if (error) toast.error("Erro ao adicionar pontos");
    else { toast.success("Pontos adicionados!"); log({ action: "create", entity_type: "loyalty", details: { points: newPoints.points } }); setShowPointsForm(false); loadData(); }
  };

  const handleDeleteCoupon = async (id: string) => {
    const { error } = await supabase.from("user_coupons").delete().eq("id", id);
    if (error) toast.error("Erro ao remover cupom");
    else { toast.success("Cupom removido"); log({ action: "delete", entity_type: "coupon", entity_id: id }); loadData(); }
  };

  const handleBulkCoupons = async () => {
    setSavingBulk(true);
    const targetUsers = bulkCoupon.targetTier === "all"
      ? userRankings.map((u) => u.userId)
      : userRankings.filter((u) => u.tier.name === bulkCoupon.targetTier).map((u) => u.userId);

    if (targetUsers.length === 0) { toast.error("Nenhum usuário no segmento selecionado"); setSavingBulk(false); return; }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + bulkCoupon.expiresInDays);

    const inserts = targetUsers.map((uid) => ({
      user_id: uid,
      code: `${bulkCoupon.prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      discount_type: bulkCoupon.discountType,
      discount_value: bulkCoupon.discountValue,
      min_order_value: bulkCoupon.minOrder,
      expires_at: expiresAt.toISOString(),
    }));

    const { error } = await supabase.from("user_coupons").insert(inserts);
    setSavingBulk(false);
    if (error) toast.error("Erro ao criar cupons em massa");
    else {
      toast.success(`${inserts.length} cupons criados!`);
      log({ action: "create", entity_type: "coupon", details: { bulk: true, count: inserts.length, tier: bulkCoupon.targetTier } });
      setShowBulkForm(false);
      loadData();
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || getName(c.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPoints = points.filter((p) =>
    (p.description || "").toLowerCase().includes(searchTerm.toLowerCase()) || getName(p.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fidelização</h1>
            <p className="text-sm text-muted-foreground">Pontos, cupons, rankings e inteligência de retenção</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPointsForm(true)} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              <Star className="h-4 w-4" /> Dar pontos
            </button>
            <button onClick={() => setShowCouponForm(true)} className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:bg-foreground/90 transition-colors">
              <Ticket className="h-4 w-4" /> Criar cupom
            </button>
            <button onClick={() => setShowBulkForm(true)} className="flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors">
              <Copy className="h-4 w-4" /> Em massa
            </button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-card rounded-2xl p-1">
            <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Visão Geral</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-xl text-xs font-semibold"><Crown className="w-3.5 h-3.5 mr-1.5" />Ranking</TabsTrigger>
            <TabsTrigger value="points" className="rounded-xl text-xs font-semibold"><Star className="w-3.5 h-3.5 mr-1.5" />Pontos</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-xl text-xs font-semibold"><Ticket className="w-3.5 h-3.5 mr-1.5" />Cupons</TabsTrigger>
            <TabsTrigger value="retention" className="rounded-xl text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Retenção</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pontos emitidos", value: totalPointsIssued.toLocaleString("pt-BR"), icon: Star, color: "text-primary", bg: "bg-primary/15" },
                  { label: "Pontos resgatados", value: totalPointsRedeemed.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/15" },
                  { label: "Cupons ativos", value: activeCoupons.length, icon: Ticket, color: "text-blue-600", bg: "bg-blue-500/15" },
                  { label: "Usuários no programa", value: uniqueUsers, icon: Users, color: "text-purple-600", bg: "bg-purple-500/15" },
                ].map((m, i) => (
                  <div key={i} className="rounded-2xl bg-card p-5 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center`}>
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-card p-6 border border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-4">Pontos emitidos vs resgatados (30 dias)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={pointsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="emitidos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" name="Emitidos" />
                      <Area type="monotone" dataKey="resgatados" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%, 0.15)" name="Resgatados" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl bg-card p-6 border border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-4">Origem dos pontos</h3>
                  {sourceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={sourceChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {sourceChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sem dados</div>
                  )}
                </div>
              </div>

              {/* Coupon ROI + Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-card p-6 border border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-2">Taxa de uso de cupons</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${couponUsageRate}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-primary" />
                    </div>
                    <span className="text-lg font-bold text-primary">{couponUsageRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{usedCoupons.length} usados de {coupons.length} emitidos</p>
                </div>

                <div className="rounded-2xl bg-card p-6 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">ROI dos Cupons</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Receita estimada</p>
                      <p className="text-lg font-extrabold text-emerald-600">{formatCurrency(couponROI.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Desconto dado</p>
                      <p className="text-lg font-extrabold text-destructive">{formatCurrency(couponROI.discount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">ROI</p>
                      <p className={`text-lg font-extrabold ${couponROI.roi >= 0 ? "text-emerald-600" : "text-destructive"}`}>{couponROI.roi}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* RANKING */}
          <TabsContent value="ranking">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Tier distribution */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {TIERS.map((tier) => {
                  const count = userRankings.filter((u) => u.tier.name === tier.name).length;
                  return (
                    <div key={tier.name} className={`rounded-2xl bg-card p-5 border ${tier.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <tier.icon className={`h-5 w-5 ${tier.color}`} />
                        <span className="text-sm font-bold text-foreground">{tier.name}</span>
                      </div>
                      <p className="text-2xl font-extrabold text-foreground">{count}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{tier.min > 0 ? `≥ ${tier.min.toLocaleString()} pts` : "< 500 pts"}</p>
                    </div>
                  );
                })}
              </div>

              {/* Top users */}
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50">
                  <h3 className="text-sm font-bold text-foreground">Top Clientes Fiéis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">#</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Cliente</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Nível</th>
                        <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Pontos</th>
                        <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Gasto total</th>
                        <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Pedidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRankings.slice(0, 20).map((u, i) => (
                        <tr key={u.userId} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                          <td className="px-5 py-3">
                            {i < 3 ? (
                              <span className={`text-lg font-extrabold ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-orange-700"}`}>
                                {i + 1}º
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-medium">{i + 1}º</span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-bold text-foreground">{getName(u.userId)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${u.tier.bg} ${u.tier.color}`}>
                              <u.tier.icon className="w-3 h-3" /> {u.tier.name}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-primary">{u.totalPoints.toLocaleString("pt-BR")}</td>
                          <td className="px-5 py-3 text-right font-semibold text-foreground">{formatCurrency(u.totalSpent)}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{u.ordersCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {userRankings.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground">Nenhum usuário no programa</div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* POINTS */}
          <TabsContent value="points">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por usuário ou descrição..."
                    className="w-full rounded-full bg-card pl-10 pr-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Usuário</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Pontos</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Origem</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Descrição</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPoints.slice(0, 50).map((p) => (
                        <tr key={p.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">{getName(p.user_id)}</td>
                          <td className={`px-5 py-3 font-bold ${p.points > 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {p.points > 0 ? "+" : ""}{p.points}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground capitalize">{p.source}</td>
                          <td className="px-5 py-3 text-muted-foreground">{p.description || "—"}</td>
                          <td className="px-5 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPoints.length === 0 && <div className="p-10 text-center text-muted-foreground">Nenhum registro encontrado</div>}
              </div>
            </motion.div>
          </TabsContent>

          {/* COUPONS */}
          <TabsContent value="coupons">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por código ou usuário..."
                    className="w-full rounded-full bg-card pl-10 pr-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Código</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Usuário</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Desconto</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Status</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Validade</th>
                        <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.slice(0, 50).map((c) => {
                        const expired = c.expires_at && new Date(c.expires_at) < new Date();
                        const status = c.used ? "Usado" : expired ? "Expirado" : "Ativo";
                        const statusColor = c.used ? "bg-muted text-muted-foreground" : expired ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600";
                        return (
                          <tr key={c.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                            <td className="px-5 py-3 font-mono font-bold text-foreground tracking-wider">{c.code}</td>
                            <td className="px-5 py-3 font-medium text-foreground">{getName(c.user_id)}</td>
                            <td className="px-5 py-3 text-primary font-bold">
                              {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}
                            </td>
                            <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>{status}</span></td>
                            <td className="px-5 py-3 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}</td>
                            <td className="px-5 py-3">
                              <button onClick={() => handleDeleteCoupon(c.id)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredCoupons.length === 0 && <div className="p-10 text-center text-muted-foreground">Nenhum cupom encontrado</div>}
              </div>
            </motion.div>
          </TabsContent>

          {/* RETENTION */}
          <TabsContent value="retention">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Churn risk */}
              <div className="rounded-2xl bg-card p-6 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <UserX className="w-4 h-4 text-destructive" />
                  <h3 className="text-sm font-bold text-foreground">Risco de Churn</h3>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">Inativos há 30+ dias com pontos</span>
                </div>
                {churnRisk.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum cliente em risco! Todos estão ativos.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {churnRisk.map((u) => {
                      const daysSince = Math.floor((Date.now() - new Date(u.lastActivity).getTime()) / 86400000);
                      return (
                        <div key={u.userId} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{getName(u.userId)}</p>
                            <p className="text-[10px] text-muted-foreground">{u.totalPoints.toLocaleString()} pts · {u.ordersCount} pedidos · {formatCurrency(u.totalSpent)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-destructive">{daysSince} dias</p>
                            <p className="text-[10px] text-muted-foreground">sem atividade</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${u.tier.bg} ${u.tier.color}`}>
                            {u.tier.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Retention insights */}
              <div className="rounded-2xl bg-card p-6 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Insights de Retenção</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Taxa de resgate</p>
                    <p className="text-2xl font-extrabold text-foreground">
                      {totalPointsIssued > 0 ? Math.round((totalPointsRedeemed / totalPointsIssued) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">dos pontos emitidos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Engajamento</p>
                    <p className="text-2xl font-extrabold text-foreground">
                      {profiles.length > 0 ? Math.round((uniqueUsers / profiles.length) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">dos clientes participam</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Valor médio por cliente</p>
                    <p className="text-2xl font-extrabold text-foreground">
                      {uniqueUsers > 0 ? formatCurrency(orders.reduce((s, o) => s + Number(o.total), 0) / uniqueUsers) : "R$ 0"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">LTV no programa</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Add Points Modal */}
        <AnimatePresence>
          {showPointsForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPointsForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-muted rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl space-y-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Dar pontos</h2>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Usuário</label>
                  <select value={newPoints.userId} onChange={(e) => setNewPoints((p) => ({ ...p, userId: e.target.value }))}
                    className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                    <option value="">Selecione...</option>
                    {profiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Pontos</label>
                  <input type="number" value={newPoints.points} onChange={(e) => setNewPoints((p) => ({ ...p, points: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Descrição</label>
                  <input value={newPoints.description} onChange={(e) => setNewPoints((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPointsForm(false)} className="flex-1 rounded-full bg-card py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
                  <button onClick={handleAddPoints} disabled={savingPoints} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingPoints ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    {savingPoints ? "Salvando..." : "Adicionar"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Coupon Modal */}
        <AnimatePresence>
          {showCouponForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowCouponForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-muted rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Criar cupom</h2>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Usuário</label>
                  <select value={newCoupon.userId} onChange={(e) => setNewCoupon((p) => ({ ...p, userId: e.target.value }))}
                    className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                    <option value="">Selecione...</option>
                    {profiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Código</label>
                  <input value={newCoupon.code} onChange={(e) => setNewCoupon((p) => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary uppercase tracking-wider" placeholder="EX: SUPET20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo</label>
                    <select value={newCoupon.discountType} onChange={(e) => setNewCoupon((p) => ({ ...p, discountType: e.target.value }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Valor</label>
                    <input type="number" value={newCoupon.discountValue} onChange={(e) => setNewCoupon((p) => ({ ...p, discountValue: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Pedido mínimo (R$)</label>
                    <input type="number" value={newCoupon.minOrder} onChange={(e) => setNewCoupon((p) => ({ ...p, minOrder: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Validade (dias)</label>
                    <input type="number" value={newCoupon.expiresInDays} onChange={(e) => setNewCoupon((p) => ({ ...p, expiresInDays: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCouponForm(false)} className="flex-1 rounded-full bg-card py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
                  <button onClick={handleCreateCoupon} disabled={savingCoupon} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                    {savingCoupon ? "Criando..." : "Criar cupom"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bulk Coupon Modal */}
        <AnimatePresence>
          {showBulkForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowBulkForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-muted rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Copy className="h-5 w-5 text-primary" /> Cupons em Massa</h2>
                <p className="text-xs text-muted-foreground">Cria um cupom único para cada cliente do segmento selecionado.</p>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Segmento (Nível)</label>
                  <select value={bulkCoupon.targetTier} onChange={(e) => setBulkCoupon((p) => ({ ...p, targetTier: e.target.value }))}
                    className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                    <option value="all">Todos os clientes ({userRankings.length})</option>
                    {TIERS.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} ({userRankings.filter((u) => u.tier.name === t.name).length})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Prefixo do código</label>
                  <input value={bulkCoupon.prefix} onChange={(e) => setBulkCoupon((p) => ({ ...p, prefix: e.target.value.toUpperCase() }))}
                    className="w-full rounded-full bg-card px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo</label>
                    <select value={bulkCoupon.discountType} onChange={(e) => setBulkCoupon((p) => ({ ...p, discountType: e.target.value }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Valor</label>
                    <input type="number" value={bulkCoupon.discountValue} onChange={(e) => setBulkCoupon((p) => ({ ...p, discountValue: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Pedido mínimo (R$)</label>
                    <input type="number" value={bulkCoupon.minOrder} onChange={(e) => setBulkCoupon((p) => ({ ...p, minOrder: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Validade (dias)</label>
                    <input type="number" value={bulkCoupon.expiresInDays} onChange={(e) => setBulkCoupon((p) => ({ ...p, expiresInDays: Number(e.target.value) }))} className="w-full rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowBulkForm(false)} className="flex-1 rounded-full bg-card py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
                  <button onClick={handleBulkCoupons} disabled={savingBulk} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {savingBulk ? "Criando..." : "Criar em massa"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
