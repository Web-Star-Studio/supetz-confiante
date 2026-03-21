import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import RevenueChart from "@/components/admin/RevenueChart";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  todayOrders: number;
  todayRevenue: number;
}

function StatsCard({ icon: Icon, label, value, color, delay, trend }: { icon: any; label: string; value: string; color: string; delay: number; trend?: { value: string; up: boolean } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className="bg-supet-bg-alt rounded-3xl p-6 cursor-default"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-extrabold text-foreground font-display">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-bold rounded-full px-2 py-1 ${trend.up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-supet-bg-alt rounded-3xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-border" />
              <div className="space-y-2">
                <div className="h-3 w-16 rounded-full bg-border" />
                <div className="h-6 w-24 rounded-full bg-border" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-supet-bg-alt rounded-3xl p-6 mb-10 animate-pulse">
        <div className="h-5 w-32 rounded-full bg-border mb-4" />
        <div className="h-48 rounded-2xl bg-border" />
      </div>
      <div className="bg-supet-bg-alt rounded-3xl p-6 animate-pulse">
        <div className="h-5 w-32 rounded-full bg-border mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-border" />)}
        </div>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalCustomers: 0, todayOrders: 0, todayRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ day: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, productsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, customer_name, created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalCustomers: profilesRes.count || 0,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + Number(o.total), 0),
      });
      setRecentOrders(orders.slice(0, 5));

      const days: { day: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
        days.push({ day: dayStr, revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0), orders: dayOrders.length });
      }
      setChartData(days);
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmado", className: "bg-sky-100 text-sky-700" },
    shipped: { label: "Enviado", className: "bg-violet-100 text-violet-700" },
    delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelado", className: "bg-rose-100 text-rose-700" },
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua loja</p>
      </div>

      {loading ? <DashboardSkeleton /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
            <StatsCard icon={ShoppingCart} label="Pedidos" value={String(stats.totalOrders)} color="bg-primary/15 text-primary" delay={0}
              trend={stats.todayOrders > 0 ? { value: `+${stats.todayOrders} hoje`, up: true } : undefined} />
            <StatsCard icon={TrendingUp} label="Receita Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} color="bg-emerald-500/15 text-emerald-600" delay={0.05}
              trend={stats.todayRevenue > 0 ? { value: `+R$ ${stats.todayRevenue.toFixed(0)} hoje`, up: true } : undefined} />
            <StatsCard icon={Package} label="Produtos" value={String(stats.totalProducts)} color="bg-sky-500/15 text-sky-600" delay={0.1} />
            <StatsCard icon={Users} label="Clientes" value={String(stats.totalCustomers)} color="bg-violet-500/15 text-violet-600" delay={0.15} />
          </div>

          <div className="mb-10">
            <RevenueChart data={chartData} />
          </div>

          <div className="bg-supet-bg-alt rounded-3xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground font-display">Pedidos Recentes</h2>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-supet-bg/60">
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground">ID</th>
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Cliente</th>
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Total</th>
                      <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => {
                      const status = statusLabels[order.status] || { label: order.status, className: "bg-muted text-muted-foreground" };
                      return (
                        <tr key={order.id} className={`transition-colors hover:bg-primary/5 ${i % 2 === 1 ? "bg-supet-bg/30" : ""}`}>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{order.customer_name || "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-foreground">R$ {Number(order.total).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}