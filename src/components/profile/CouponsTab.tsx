import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Ticket, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  used: boolean;
  expires_at: string | null;
  created_at: string;
}

function couponStatus(coupon: Coupon): { label: string; color: string; icon: typeof CheckCircle2 } {
  if (coupon.used) return { label: "Usado", color: "bg-muted text-muted-foreground", icon: XCircle };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { label: "Expirado", color: "bg-red-100 text-red-800", icon: Clock };
  return { label: "Ativo", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
}

export default function CouponsTab() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCoupons();
  }, [user]);

  const loadCoupons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_coupons")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const activeCoupons = coupons.filter((c) => !c.used && (!c.expires_at || new Date(c.expires_at) >= new Date()));
  const inactiveCoupons = coupons.filter((c) => c.used || (c.expires_at && new Date(c.expires_at) < new Date()));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      {coupons.length === 0 ? (
        <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
          <Ticket className="mx-auto h-12 w-12 text-primary/40 mb-3" />
          <p className="text-lg font-semibold text-foreground">Nenhum cupom</p>
          <p className="text-sm text-muted-foreground mt-1">Seus cupons promocionais aparecerão aqui.</p>
        </div>
      ) : (
        <>
          {activeCoupons.length > 0 && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3 px-1">Cupons ativos ({activeCoupons.length})</p>
              <div className="space-y-3">
                {activeCoupons.map((coupon, i) => (
                  <CouponCard key={coupon.id} coupon={coupon} index={i} onCopy={copyCode} />
                ))}
              </div>
            </div>
          )}

          {inactiveCoupons.length > 0 && (
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-3 px-1">Inativos ({inactiveCoupons.length})</p>
              <div className="space-y-3 opacity-60">
                {inactiveCoupons.map((coupon, i) => (
                  <CouponCard key={coupon.id} coupon={coupon} index={i} onCopy={copyCode} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function CouponCard({ coupon, index, onCopy }: { coupon: Coupon; index: number; onCopy: (code: string) => void }) {
  const status = couponStatus(coupon);
  const StatusIcon = status.icon;
  const isActive = !coupon.used && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-3xl bg-supet-bg-alt p-5 sm:p-6 relative overflow-hidden"
    >
      {/* Decorative ticket cutouts */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-supet-bg" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-6 w-6 rounded-full bg-supet-bg" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-2xl font-bold text-primary">
            {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
            <span className="text-sm font-normal text-muted-foreground ml-1">OFF</span>
          </p>
          {coupon.min_order_value && coupon.min_order_value > 0 && (
            <p className="text-xs text-muted-foreground">Pedido mín. R$ {Number(coupon.min_order_value).toFixed(2).replace(".", ",")}</p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 ${status.color}`}>
          <StatusIcon className="h-3 w-3" /> {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-full bg-supet-bg px-4 py-2 text-sm font-mono font-bold text-foreground text-center tracking-wider border border-dashed border-primary/30">
          {coupon.code}
        </code>
        {isActive && (
          <button
            onClick={() => onCopy(coupon.code)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>

      {coupon.expires_at && (
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Válido até {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}
        </p>
      )}
    </motion.div>
  );
}
