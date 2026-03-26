import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DollarSign, MousePointerClick, ShoppingCart, Clock, Copy, CheckCircle,
  Loader2, Wallet, TrendingUp, ArrowRight, Handshake, ExternalLink, User,
} from "lucide-react";
import { format } from "date-fns";

interface Affiliate {
  id: string;
  name: string;
  status: string;
  commission_percent: number;
  coupon_code: string | null;
  ref_slug: string | null;
  total_earned: number;
  pix_key: string | null;
}

interface Sale {
  id: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function AffiliateDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!aff) {
      setLoading(false);
      return;
    }

    setAffiliate(aff as Affiliate);
    setPixKey(aff.pix_key || "");

    // Load sales, payouts, clicks in parallel
    const [salesRes, payoutsRes, clicksRes] = await Promise.all([
      supabase.from("affiliate_sales").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
      supabase.from("affiliate_payouts").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
      supabase.from("affiliate_clicks").select("id", { count: "exact" }).eq("affiliate_id", aff.id),
    ]);

    setSales((salesRes.data as Sale[]) || []);
    setPayouts((payoutsRes.data as Payout[]) || []);
    setClicks(clicksRes.count || 0);
    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRequestPayout = async () => {
    if (!affiliate) return;
    const pendingAmount = sales
      .filter((s) => s.status === "confirmed")
      .reduce((sum, s) => sum + s.commission_amount, 0);

    if (pendingAmount <= 0) {
      toast.error("Você não possui saldo disponível para saque.");
      return;
    }

    setRequestingPayout(true);

    // Save pix key if changed
    if (pixKey && pixKey !== affiliate.pix_key) {
      await supabase.from("affiliates").update({ pix_key: pixKey }).eq("id", affiliate.id);
    }

    const { error } = await supabase.from("affiliate_payouts").insert({
      affiliate_id: affiliate.id,
      amount: pendingAmount,
      pix_key: pixKey || null,
    });

    if (error) {
      toast.error("Erro ao solicitar saque.");
    } else {
      toast.success("Solicitação de saque enviada!");
      loadData();
    }
    setRequestingPayout(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!affiliate) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-24 px-6">
          <div className="text-center max-w-md">
            <Handshake className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Você ainda não é um parceiro</h1>
            <p className="text-muted-foreground mb-6">Candidate-se ao programa de parceiros para acessar este painel.</p>
            <Link to="/parceiros" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Candidatar-se
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (affiliate.status === "pending") {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-24 px-6">
          <div className="text-center max-w-md">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Candidatura em análise</h1>
            <p className="text-muted-foreground">Sua candidatura está sendo analisada. Você será notificado quando for aprovada.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const confirmedEarnings = sales.filter((s) => s.status === "confirmed").reduce((sum, s) => sum + s.commission_amount, 0);
  const pendingEarnings = sales.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.commission_amount, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const siteUrl = window.location.origin;
  const refLink = `${siteUrl}/?ref=${affiliate.ref_slug}`;

  const kpis = [
    { label: "Total Ganho", value: `R$ ${affiliate.total_earned.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-green-500" },
    { label: "Cliques no Link", value: clicks.toString(), icon: MousePointerClick, color: "text-blue-500" },
    { label: "Vendas", value: sales.length.toString(), icon: ShoppingCart, color: "text-primary" },
    { label: "Comissão Pendente", value: `R$ ${pendingEarnings.toFixed(2).replace(".", ",")}`, icon: Clock, color: "text-yellow-500" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 md:pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground mb-1">Painel do Parceiro</h1>
              <p className="text-muted-foreground">Olá, <span className="font-bold text-foreground">{affiliate.name}</span> · Comissão: {affiliate.commission_percent}%</p>
            </div>
            <Link to="/perfil" className="bg-muted text-foreground font-bold px-4 py-2 rounded-xl text-sm hover:bg-muted/80 transition-colors flex items-center gap-2">
              <User className="w-4 h-4" /> Minha Conta
            </Link>
          </motion.div>

          {/* Share section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" /> Seus links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Link de indicação</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={refLink} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono" />
                  <button onClick={() => copyToClipboard(refLink, "Link")} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-bold hover:opacity-90">
                    {copied === "Link" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {affiliate.coupon_code && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Cupom exclusivo</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={affiliate.coupon_code} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono font-bold" />
                    <button onClick={() => copyToClipboard(affiliate.coupon_code!, "Cupom")} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-bold hover:opacity-90">
                      {copied === "Cupom" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="bg-card border border-border rounded-2xl p-5">
                <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
                <p className="text-2xl font-black text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground font-bold">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Sales table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Vendas
            </h2>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda ainda. Compartilhe seu link!</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-bold text-muted-foreground">Data</th>
                      <th className="pb-2 font-bold text-muted-foreground">Total Pedido</th>
                      <th className="pb-2 font-bold text-muted-foreground">Comissão</th>
                      <th className="pb-2 font-bold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-border/50">
                        <td className="py-3 text-foreground">{format(new Date(sale.created_at), "dd/MM/yyyy")}</td>
                        <td className="py-3 text-foreground">R$ {sale.order_total.toFixed(2).replace(".", ",")}</td>
                        <td className="py-3 text-green-600 font-bold">R$ {sale.commission_amount.toFixed(2).replace(".", ",")}</td>
                        <td className="py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            sale.status === "paid" ? "bg-green-100 text-green-700" :
                            sale.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {sale.status === "paid" ? "Pago" : sale.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Payout section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Saques
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-muted rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Disponível para saque</p>
                <p className="text-xl font-black text-green-600">R$ {confirmedEarnings.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Pendente de confirmação</p>
                <p className="text-xl font-black text-yellow-600">R$ {pendingEarnings.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-bold mb-1">Total já pago</p>
                <p className="text-xl font-black text-foreground">R$ {totalPaid.toFixed(2).replace(".", ",")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3 mb-6">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Chave Pix para recebimento</label>
                <input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="CPF, e-mail ou chave aleatória"
                />
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={requestingPayout || confirmedEarnings <= 0}
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {requestingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Solicitar Saque
              </button>
            </div>

            {payouts.length > 0 && (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-bold text-muted-foreground">Data</th>
                      <th className="pb-2 font-bold text-muted-foreground">Valor</th>
                      <th className="pb-2 font-bold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-3 text-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</td>
                        <td className="py-3 text-foreground font-bold">R$ {p.amount.toFixed(2).replace(".", ",")}</td>
                        <td className="py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            p.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {p.status === "paid" ? "Pago" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
