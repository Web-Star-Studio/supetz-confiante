import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingBag, Star, ChevronDown, ChevronUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClientData {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  orderCount: number;
  totalSpent: number;
  totalPoints: number;
  lastOrderDate: string | null;
}

function ClientsSkeleton() {
  return (
    <div className="bg-supet-bg-alt rounded-3xl overflow-hidden">
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-border" />
              <div className="h-3 w-20 rounded-full bg-border" />
            </div>
            <div className="h-4 w-16 rounded-full bg-border" />
            <div className="h-4 w-20 rounded-full bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminClientes() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const [profilesRes, ordersRes, pointsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total, created_at"),
        supabase.from("loyalty_points").select("user_id, points"),
      ]);

      const profiles = profilesRes.data || [];
      const orders = ordersRes.data || [];
      const points = pointsRes.data || [];

      const enriched: ClientData[] = profiles.map((p) => {
        const userOrders = orders.filter((o) => o.user_id === p.user_id);
        const userPoints = points.filter((pt) => pt.user_id === p.user_id);
        const sortedOrders = userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          phone: p.phone,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((s, o) => s + Number(o.total), 0),
          totalPoints: userPoints.reduce((s, pt) => s + pt.points, 0),
          lastOrderDate: sortedOrders[0]?.created_at || null,
        };
      });

      setClients(enriched);
      setLoading(false);
    }
    fetchClients();
  }, []);

  const filtered = clients.filter(
    (c) => !search || (c.full_name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  );

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.orderCount > 0).length;
  const avgSpent = clients.length > 0 ? clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length : 0;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Clientes</h1>
        <p className="text-muted-foreground mt-1">Usuários cadastrados na plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-xl font-extrabold text-foreground">{totalClients}</p>
          </div>
        </div>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Com compras</p>
            <p className="text-xl font-extrabold text-foreground">{activeClients}</p>
          </div>
        </div>
        <div className="bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Gasto médio</p>
            <p className="text-xl font-extrabold text-foreground">R$ {avgSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>

      {loading ? (
        <ClientsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-supet-bg-alt rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhum cliente encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client, i) => {
            const isExpanded = expandedId === client.id;
            const initials = client.full_name
              ? client.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-supet-bg-alt rounded-3xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-primary/5 transition-colors"
                >
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{client.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{client.phone || "Sem telefone"}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> {client.orderCount} pedidos
                    </span>
                    <span className="font-semibold text-foreground">R$ {client.totalSpent.toFixed(2)}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border/50">
                        <div className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium">Pedidos</p>
                          <p className="text-lg font-bold text-foreground">{client.orderCount}</p>
                        </div>
                        <div className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium">Total gasto</p>
                          <p className="text-lg font-bold text-foreground">R$ {client.totalSpent.toFixed(2)}</p>
                        </div>
                        <div className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium">Pontos</p>
                          <p className="text-lg font-bold text-primary">{client.totalPoints}</p>
                        </div>
                        <div className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium">Último pedido</p>
                          <p className="text-sm font-semibold text-foreground">
                            {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-4 pt-2">
                          <p className="text-xs text-muted-foreground">
                            Cadastrado em {new Date(client.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}