import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, Users, TrendingUp } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
}

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-extrabold text-foreground font-display">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalCustomers: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, productsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, customer_name, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalCustomers: profilesRes.count || 0,
      });
      setRecentOrders(orders.slice(0, 5));
    }
    fetchStats();
  }, []);

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
    confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
    shipped: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
    delivered: { label: "Entregue", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua loja</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatsCard icon={ShoppingCart} label="Pedidos" value={String(stats.totalOrders)} color="bg-primary/10 text-primary" />
        <StatsCard icon={TrendingUp} label="Receita Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} color="bg-green-500/10 text-green-600" />
        <StatsCard icon={Package} label="Produtos" value={String(stats.totalProducts)} color="bg-blue-500/10 text-blue-600" />
        <StatsCard icon={Users} label="Clientes" value={String(stats.totalCustomers)} color="bg-purple-500/10 text-purple-600" />
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground font-display">Pedidos Recentes</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map(order => {
                  const status = statusLabels[order.status] || { label: order.status, className: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{order.customer_name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">R$ {Number(order.total).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
