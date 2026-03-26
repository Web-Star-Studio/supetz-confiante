import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShoppingBag, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import OrderTrackingTimeline from "./OrderTrackingTimeline";

interface OrderItem {
  id?: string;
  title?: string;
  quantity?: number;
  price?: number;
  subtitle?: string;
  originalPrice?: number;
  pricePerUnit?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
  customer_name: string | null;
}

const PAGE_SIZE = 5;

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

function OrdersSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-full bg-border" />
              <div className="h-3 w-16 rounded-full bg-border" />
            </div>
            <div className="h-6 w-20 rounded-full bg-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-40 rounded-full bg-border" />
            <div className="h-3 w-32 rounded-full bg-border" />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-6">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex flex-col items-center gap-1">
                  <div className="h-7 w-7 rounded-full bg-border" />
                  <div className="h-2 w-10 rounded-full bg-border" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 border-t border-border/50 pt-3 flex justify-between items-center">
            <div className="h-8 w-36 rounded-full bg-border" />
            <div className="h-5 w-20 rounded-full bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersTab() {
  const { user } = useAuth();
  const { addItem, openCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, page]);

  const loadOrders = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from("orders")
      .select("id, created_at, status, total, items, customer_name", { count: "exact" })
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    setOrders((data as Order[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleReorder = (order: Order) => {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
    let added = 0;
    items.forEach((item) => {
      if (item.title && item.price) {
        addItem({
          id: item.id || `reorder-${Date.now()}-${Math.random()}`,
          title: item.title,
          subtitle: item.subtitle || "",
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          pricePerUnit: item.pricePerUnit || "",
          quantity: item.quantity || 1,
        });
        added++;
      }
    });
    if (added > 0) {
      toast.success(`${added} item${added > 1 ? "s" : ""} adicionado${added > 1 ? "s" : ""} ao carrinho!`);
      openCart();
    } else {
      toast.error("Não foi possível readicionar os itens");
    }
  };

  if (loading) return <OrdersSkeleton />;

  if (orders.length === 0 && page === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-primary/40 mb-3" />
          <p className="text-lg font-semibold text-foreground">Nenhuma compra ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Quando você fizer um pedido, ele aparecerá aqui.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      {orders.map((order, i) => {
        const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
        return (
          <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-sm font-mono text-muted-foreground/60 mt-0.5">#{order.id.slice(0, 8)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <div className="space-y-1 text-sm text-foreground/80">
              {items.slice(0, 3).map((item, j) => (
                <p key={j}>{item.quantity || 1}x {item.title || "Produto"}</p>
              ))}
              {items.length > 3 && <p className="text-muted-foreground">+{items.length - 3} itens</p>}
            </div>
            <OrderTrackingTimeline status={order.status} />
            <div className="mt-3 border-t border-border/50 pt-3 flex items-center justify-between">
              <button onClick={() => handleReorder(order)} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Comprar novamente
              </button>
              <span className="text-lg font-bold text-primary">R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
            </div>
          </motion.div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-supet-bg-alt text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-supet-bg-alt text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
