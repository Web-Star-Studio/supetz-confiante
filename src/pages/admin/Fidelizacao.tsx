import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion } from "framer-motion";
import { Star, Ticket, Users, TrendingUp, Plus, Loader2, Search, Gift, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

const COLORS = ["hsl(27, 100%, 49%)", "hsl(27, 100%, 70%)", "hsl(28, 38%, 75%)", "hsl(25, 20%, 60%)"];

export default function Fidelizacao() {
  const [loading, setLoading] = useState(true);
  const { log } = useAuditLog();
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [coupons, setCoupons] = useState<CouponEntry[]>([]);
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [tab, setTab] = useState<"overview" | "points" | "coupons">("overview");

  // New coupon form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ userId: "", code: "", discountType: "percentage", discountValue: 10, minOrder: 0, expiresInDays: 30 });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // New points form
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [newPoints, setNewPoints] = useState({ userId: "", points: 100, description: "Bônus manual" });
  const [savingPoints, setSavingPoints] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pointsRes, couponsRes, profilesRes] = await Promise.all([
      supabase.from("loyalty_points").select("*").order("created_at", { ascending: false }),
      supabase.from("user_coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    setPoints((pointsRes.data as PointsEntry[]) || []);
    setCoupons((couponsRes.data as CouponEntry[]) || []);
    setProfiles((profilesRes.data as ProfileInfo[]) || []);
    setLoading(false);
  };

  const getName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.full_name || userId.slice(0, 8) + "...";
  };

  // Metrics
  const totalPointsIssued = points.reduce((s, p) => s + (p.points > 0 ? p.points : 0), 0);
  const totalPointsRedeemed = points.reduce((s, p) => s + (p.points < 0 ? Math.abs(p.points) : 0), 0);
  const activeCoupons = coupons.filter((c) => !c.used && (!c.expires_at || new Date(c.expires_at) >= new Date()));
  const usedCoupons = coupons.filter((c) => c.used);
  const uniqueUsers = new Set(points.map((p) => p.user_id)).size;

  // Chart: points by source
  const sourceMap: Record<string, number> = {};
  points.forEach((p) => {
    if (p.points > 0) sourceMap[p.source] = (sourceMap[p.source] || 0) + p.points;
  });
  const sourceChartData = Object.entries(sourceMap).map(([name, value]) => ({
    name: name === "purchase" ? "Compras" : name === "bonus" ? "Bônus" : name === "referral" ? "Indicação" : name,
    value,
  }));

  // Chart: points per day (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });
  const dailyPoints = last14.map((day) => ({
    day: day.slice(5),
    pontos: points.filter((p) => p.created_at.startsWith(day) && p.points > 0).reduce((s, p) => s + p.points, 0),
  }));

  // Coupon usage rate
  const couponUsageRate = coupons.length > 0 ? Math.round((usedCoupons.length / coupons.length) * 100) : 0;

  const handleCreateCoupon = async () => {
    if (!newCoupon.userId || !newCoupon.code) { toast.error("Preencha todos os campos"); return; }
    setSavingCoupon(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + newCoupon.expiresInDays);

    const { error } = await supabase.from("user_coupons").insert({
      user_id: newCoupon.userId,
      code: newCoupon.code.toUpperCase(),
      discount_type: newCoupon.discountType,
      discount_value: newCoupon.discountValue,
      min_order_value: newCoupon.minOrder,
      expires_at: expiresAt.toISOString(),
    });

    setSavingCoupon(false);
    if (error) toast.error("Erro ao criar cupom");
    else { toast.success("Cupom criado!"); log({ action: "create", entity_type: "coupon", details: { code: newCoupon.code, userId: newCoupon.userId } }); setShowCouponForm(false); loadData(); }
  };

  const handleAddPoints = async () => {
    if (!newPoints.userId) { toast.error("Selecione um usuário"); return; }
    setSavingPoints(true);

    const { error } = await supabase.from("loyalty_points").insert({
      user_id: newPoints.userId,
      points: newPoints.points,
      source: "bonus",
      description: newPoints.description,
    });

    setSavingPoints(false);
    if (error) toast.error("Erro ao adicionar pontos");
    else { toast.success("Pontos adicionados!"); setShowPointsForm(false); loadData(); }
  };

  const handleDeleteCoupon = async (id: string) => {
    const { error } = await supabase.from("user_coupons").delete().eq("id", id);
    if (error) toast.error("Erro ao remover cupom");
    else { toast.success("Cupom removido"); loadData(); }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getName(c.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPoints = points.filter((p) =>
    (p.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    getName(p.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fidelização</h1>
            <p className="text-sm text-muted-foreground">Gerencie pontos, cupons e métricas de fidelidade</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPointsForm(true)} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              <Star className="h-4 w-4" /> Dar pontos
            </button>
            <button onClick={() => setShowCouponForm(true)} className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:bg-foreground/90 transition-colors">
              <Ticket className="h-4 w-4" /> Criar cupom
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-supet-bg-alt rounded-full p-1 w-fit">
          {(["overview", "points", "coupons"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "overview" ? "Visão geral" : t === "points" ? "Pontos" : "Cupons"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Pontos emitidos", value: totalPointsIssued.toLocaleString("pt-BR"), icon: Star, color: "text-primary" },
                { label: "Pontos resgatados", value: totalPointsRedeemed.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-green-600" },
                { label: "Cupons ativos", value: activeCoupons.length, icon: Ticket, color: "text-blue-600" },
                { label: "Usuários no programa", value: uniqueUsers, icon: Users, color: "text-purple-600" },
              ].map((m, i) => (
                <div key={i} className="rounded-2xl bg-supet-bg-alt p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <m.icon className={`h-5 w-5 ${m.color}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-supet-bg-alt p-6 border border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-4">Pontos emitidos (últimos 14 dias)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(28, 20%, 85%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(25, 10%, 45%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(25, 10%, 45%)" />
                    <Tooltip />
                    <Bar dataKey="pontos" fill="hsl(27, 100%, 49%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl bg-supet-bg-alt p-6 border border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-4">Origem dos pontos</h3>
                {sourceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={sourceChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {sourceChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sem dados</div>
                )}
              </div>
            </div>

            {/* Coupon usage */}
            <div className="rounded-2xl bg-supet-bg-alt p-6 border border-border/50">
              <h3 className="text-sm font-bold text-foreground mb-2">Taxa de uso de cupons</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${couponUsageRate}%` }} />
                </div>
                <span className="text-lg font-bold text-primary">{couponUsageRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{usedCoupons.length} usados de {coupons.length} emitidos</p>
            </div>
          </motion.div>
        )}

        {/* POINTS TAB */}
        {tab === "points" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por usuário ou descrição..."
                  className="w-full rounded-full bg-supet-bg-alt pl-10 pr-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-supet-bg-alt border border-border/50 overflow-hidden">
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
                        <td className={`px-5 py-3 font-bold ${p.points > 0 ? "text-green-600" : "text-destructive"}`}>
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
              {filteredPoints.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">Nenhum registro encontrado</div>
              )}
            </div>
          </motion.div>
        )}

        {/* COUPONS TAB */}
        {tab === "coupons" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código ou usuário..."
                  className="w-full rounded-full bg-supet-bg-alt pl-10 pr-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-supet-bg-alt border border-border/50 overflow-hidden">
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
                      const statusColor = c.used ? "bg-muted text-muted-foreground" : expired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
                      return (
                        <tr key={c.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-foreground tracking-wider">{c.code}</td>
                          <td className="px-5 py-3 font-medium text-foreground">{getName(c.user_id)}</td>
                          <td className="px-5 py-3 text-primary font-bold">
                            {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>{status}</span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => handleDeleteCoupon(c.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredCoupons.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">Nenhum cupom encontrado</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Add Points Modal */}
        {showPointsForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPointsForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-supet-bg rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" /> Dar pontos
              </h2>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Usuário</label>
                <select
                  value={newPoints.userId}
                  onChange={(e) => setNewPoints((p) => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {profiles.map((p) => (
                    <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Pontos</label>
                <input type="number" value={newPoints.points} onChange={(e) => setNewPoints((p) => ({ ...p, points: Number(e.target.value) }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Descrição</label>
                <input value={newPoints.description} onChange={(e) => setNewPoints((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPointsForm(false)} className="flex-1 rounded-full bg-supet-bg-alt py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
                <button onClick={handleAddPoints} disabled={savingPoints} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingPoints ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                  {savingPoints ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {showCouponForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowCouponForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-supet-bg rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" /> Criar cupom
              </h2>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Usuário</label>
                <select
                  value={newCoupon.userId}
                  onChange={(e) => setNewCoupon((p) => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {profiles.map((p) => (
                    <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Código</label>
                <input value={newCoupon.code} onChange={(e) => setNewCoupon((p) => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm font-mono font-bold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary uppercase tracking-wider" placeholder="EX: SUPET20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo</label>
                  <select value={newCoupon.discountType} onChange={(e) => setNewCoupon((p) => ({ ...p, discountType: e.target.value }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary">
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Valor</label>
                  <input type="number" value={newCoupon.discountValue} onChange={(e) => setNewCoupon((p) => ({ ...p, discountValue: Number(e.target.value) }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Pedido mínimo (R$)</label>
                  <input type="number" value={newCoupon.minOrder} onChange={(e) => setNewCoupon((p) => ({ ...p, minOrder: Number(e.target.value) }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Validade (dias)</label>
                  <input type="number" value={newCoupon.expiresInDays} onChange={(e) => setNewCoupon((p) => ({ ...p, expiresInDays: Number(e.target.value) }))} className="w-full rounded-full bg-supet-bg-alt px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCouponForm(false)} className="flex-1 rounded-full bg-supet-bg-alt py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
                <button onClick={handleCreateCoupon} disabled={savingCoupon} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                  {savingCoupon ? "Criando..." : "Criar cupom"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
