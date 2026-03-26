import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Copy, CheckCircle, X, MapPin, ShoppingCart, Clock, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditLog } from "@/hooks/useAuditLog";

function PedidosSkeleton() {
  return (
    <div className="bg-card rounded-3xl overflow-hidden">
      <div className="p-6 space-y-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 animate-pulse border-b border-border/30 last:border-0">
            <div className="h-4 w-16 rounded-full bg-border" />
            <div className="h-4 w-28 rounded-full bg-border" />
            <div className="h-6 w-20 rounded-full bg-border" />
            <div className="h-4 w-20 rounded-full bg-border ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { log } = useAuditLog();

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const statusMessages: Record<string, string> = {
    confirmed: "Seu pedido foi confirmado e está sendo preparado! ✅",
    shipped: "Seu pedido foi enviado! 🚚 Em breve chegará ao destino.",
    delivered: "Seu pedido foi entregue! 🎉 Esperamos que aproveite.",
    cancelled: "Seu pedido foi cancelado. Entre em contato se precisar de ajuda.",
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Get order to find user_id
    const order = orders.find(o => o.id === orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    log({ action: "update", entity_type: "order", entity_id: orderId, details: { status: newStatus } });

    // Send in-app notification to the customer
    if (order?.user_id && statusMessages[newStatus]) {
      await supabase.from("user_notifications").insert({
        user_id: order.user_id,
        title: `Pedido #${orderId.slice(0, 8)} — ${statusLabels[newStatus]?.label || newStatus}`,
        message: statusMessages[newStatus],
        type: "order",
        link: "/perfil",
      });
    }

    fetchOrders();
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmado", className: "bg-sky-100 text-sky-700" },
    shipped: { label: "Enviado", className: "bg-violet-100 text-violet-700" },
    delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelado", className: "bg-rose-100 text-rose-700" },
  };

  const filtered = orders.filter(o =>
    !search || (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );

  // Summary counts
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const shippedCount = orders.filter(o => o.status === "shipped").length;

  const formatAddress = (addr: any) => {
    if (!addr || typeof addr !== "object") return null;
    const parts = [addr.street, addr.number && `nº ${addr.number}`, addr.complement, addr.neighborhood, addr.city && addr.state && `${addr.city}/${addr.state}`, addr.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Pedidos</h1>
        <p className="text-muted-foreground mt-1">Gerencie os pedidos da loja</p>
      </div>

      {/* Quick stats */}
      {!loading && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2.5">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{orders.length}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">{pendingCount}</span>
              <span className="text-xs text-amber-600">pendentes</span>
            </div>
          )}
          {shippedCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-violet-50 px-4 py-2.5">
              <Truck className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-bold text-violet-700">{shippedCount}</span>
              <span className="text-xs text-violet-600">em trânsito</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou ID..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-11 pr-8 py-3 rounded-2xl bg-card text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? <PedidosSkeleton /> : (
        <div className="bg-card rounded-3xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left px-6 py-3 font-semibold text-muted-foreground">ID</th>
                    <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Data</th>
                    <th className="text-center px-6 py-3 font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => {
                    const status = statusLabels[order.status] || { label: order.status, className: "bg-muted text-muted-foreground" };
                    return (
                      <tr key={order.id} className={`transition-colors hover:bg-primary/5 cursor-pointer ${i % 2 === 1 ? "bg-muted/30" : ""}`}
                        onClick={() => setSelectedOrder(order)}>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{order.customer_name || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">R$ {Number(order.total).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-muted text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value="pending">Pendente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregue</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-muted rounded-3xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-foreground font-display">Detalhes do Pedido</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">{selectedOrder.id}</span>
                  <button onClick={() => copyId(selectedOrder.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                    <p className="text-sm font-semibold text-foreground">{selectedOrder.customer_name || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">E-mail</label>
                    <p className="text-sm text-foreground">{selectedOrder.customer_email || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Telefone</label>
                    <p className="text-sm text-foreground">{selectedOrder.customer_phone || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Total</label>
                    <p className="text-sm font-bold text-foreground">R$ {Number(selectedOrder.total).toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-2 block">Itens</label>
                  <div className="bg-card rounded-2xl p-4 space-y-2">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      (selectedOrder.items as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-foreground">{item.title || item.name || `Item ${idx + 1}`} × {item.quantity || 1}</span>
                          <span className="font-semibold text-foreground">R$ {Number(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum item registrado.</p>
                    )}
                  </div>
                </div>

                {/* Shipping Address - formatted */}
                {selectedOrder.shipping_address && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">Endereço de Entrega</label>
                    <div className="bg-card rounded-2xl p-4 text-sm text-foreground flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        {(() => {
                          const addr = selectedOrder.shipping_address;
                          const formatted = formatAddress(addr);
                          if (formatted) return <p>{formatted}</p>;
                          return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(addr, null, 2)}</pre>;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status update */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-2 block">Atualizar status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      updateStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({ ...selectedOrder, status: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}