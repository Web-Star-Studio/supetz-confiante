import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  Handshake, Users, DollarSign, TrendingUp, CheckCircle, XCircle,
  Clock, Eye, Loader2, Search, Wallet, Plus, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Affiliate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  instagram: string | null;
  channel_type: string;
  status: string;
  commission_percent: number;
  coupon_code: string | null;
  ref_slug: string | null;
  total_earned: number;
  created_at: string;
  approved_at: string | null;
  pix_key: string | null;
}

interface Sale {
  id: string;
  affiliate_id: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  pix_key: string | null;
  created_at: string;
  paid_at: string | null;
}

export default function Afiliados() {
  const { log } = useAuditLog();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [editCommission, setEditCommission] = useState<number>(10);
  const [editFields, setEditFields] = useState({ name: "", email: "", instagram: "", pix_key: "", channel_type: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", instagram: "", channel_type: "influencer",
    commission_percent: 10, pix_key: "", autoApprove: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [affRes, salesRes, payoutsRes] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_sales").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_payouts").select("*").order("created_at", { ascending: false }),
    ]);
    setAffiliates((affRes.data as Affiliate[]) || []);
    setSales((salesRes.data as Sale[]) || []);
    setPayouts((payoutsRes.data as Payout[]) || []);
    setLoading(false);
  };

  const handleApprove = async (aff: Affiliate) => {
    const couponCode = `SUPET-${aff.name.split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const refSlug = aff.ref_slug || aff.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(2, 5);

    const { error } = await supabase
      .from("affiliates")
      .update({
        status: "active",
        approved_at: new Date().toISOString(),
        coupon_code: couponCode,
        ref_slug: refSlug,
      })
      .eq("id", aff.id);

    if (error) {
      toast.error("Erro ao aprovar afiliado");
      return;
    }

    // Send in-app notification to the affiliate
    const affiliateLink = `${window.location.origin}/?ref=${refSlug}`;
    await supabase.from("user_notifications").insert({
      user_id: aff.user_id,
      title: "🎉 Você foi aprovado como parceiro Supet!",
      message: `Parabéns, ${aff.name}! Seu cupom exclusivo é ${couponCode} (${aff.commission_percent}% de comissão). Compartilhe seu link: ${affiliateLink}`,
      type: "affiliate",
      link: "/parceiros/dashboard",
    });

    // Send approval email via edge function
    await supabase.functions.invoke("notify-affiliate-approved", {
      body: {
        affiliateId: aff.id,
        name: aff.name,
        email: aff.email,
        couponCode,
        refSlug,
        commissionPercent: aff.commission_percent,
        affiliateLink,
      },
    });

    toast.success(`${aff.name} aprovado! Cupom: ${couponCode}`);
    log({ action: "create", entity_type: "affiliate", entity_id: aff.id, details: { name: aff.name, coupon: couponCode, refSlug } });
    loadData();
  };

  const handleSuspend = async (aff: Affiliate) => {
    const { error } = await supabase.from("affiliates").update({ status: "suspended" }).eq("id", aff.id);
    if (error) {
      toast.error("Erro ao suspender");
    } else {
      toast.success(`${aff.name} suspenso.`);
      log({ action: "update", entity_type: "affiliate", entity_id: aff.id, details: { action: "suspend", name: aff.name } });
      loadData();
    }
  };

  const handleReactivate = async (aff: Affiliate) => {
    const { error } = await supabase.from("affiliates").update({ status: "active" }).eq("id", aff.id);
    if (error) {
      toast.error("Erro ao reativar");
    } else {
      toast.success(`${aff.name} reativado.`);
      loadData();
    }
  };

  const handleDelete = async (aff: Affiliate) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente "${aff.name}"? Esta ação não pode ser desfeita.`)) return;
    
    // Delete related records first, then the affiliate
    await Promise.all([
      supabase.from("affiliate_sales").delete().eq("affiliate_id", aff.id),
      supabase.from("affiliate_clicks").delete().eq("affiliate_id", aff.id),
      supabase.from("affiliate_payouts").delete().eq("affiliate_id", aff.id),
    ]);

    const { error } = await supabase.from("affiliates").delete().eq("id", aff.id);
    if (error) {
      toast.error("Erro ao excluir afiliado: " + error.message);
    } else {
      toast.success(`${aff.name} excluído permanentemente.`);
      log({ action: "delete", entity_type: "affiliate", entity_id: aff.id, details: { name: aff.name, email: aff.email } });
      loadData();
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedAffiliate) return;
    const { error } = await supabase.from("affiliates").update({ commission_percent: editCommission }).eq("id", selectedAffiliate.id);
    if (error) {
      toast.error("Erro ao atualizar comissão");
    } else {
      toast.success("Comissão atualizada!");
      log({ action: "update", entity_type: "affiliate", entity_id: selectedAffiliate.id, details: { new_percent: editCommission } });
      setSelectedAffiliate(null);
      loadData();
    }
  };

  const handleSaveEditFields = async () => {
    if (!selectedAffiliate) return;
    const { error } = await supabase.from("affiliates").update({
      name: editFields.name,
      email: editFields.email,
      instagram: editFields.instagram || null,
      pix_key: editFields.pix_key || null,
      channel_type: editFields.channel_type,
    }).eq("id", selectedAffiliate.id);
    if (error) {
      toast.error("Erro ao salvar alterações");
    } else {
      toast.success("Dados atualizados!");
      log({ action: "update", entity_type: "affiliate", entity_id: selectedAffiliate.id, details: { edited: editFields } });
      setSelectedAffiliate(null);
      loadData();
    }
  };

  const openAffiliateDetail = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setEditCommission(aff.commission_percent);
    setEditFields({
      name: aff.name,
      email: aff.email,
      instagram: aff.instagram || "",
      pix_key: aff.pix_key || "",
      channel_type: aff.channel_type,
    });
  };

  const handleMarkPayoutPaid = async (payout: Payout) => {
    const { error } = await supabase.from("affiliate_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payout.id);
    if (error) {
      toast.error("Erro ao marcar como pago");
    } else {
      toast.success("Saque marcado como pago!");
      log({ action: "update", entity_type: "affiliate_payout", entity_id: payout.id, details: { amount: payout.amount } });
      loadData();
    }
  };

  const handleConfirmSale = async (sale: Sale) => {
    const { error } = await supabase.from("affiliate_sales").update({ status: "confirmed" }).eq("id", sale.id);
    if (!error) {
      toast.success("Venda confirmada!");
      loadData();
    }
  };

  const handleAddAffiliate = async () => {
    if (!addForm.name || !addForm.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    const refSlug = addForm.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(2, 5);
    const couponCode = addForm.autoApprove
      ? `SUPET-${addForm.name.split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : null;

    // Try to find existing user by email using DB function
    let userId = "00000000-0000-0000-0000-000000000000";
    const { data: foundUserId } = await supabase.rpc("find_user_id_by_email", { lookup_email: addForm.email });
    if (foundUserId) {
      userId = foundUserId;
    }

    const { error } = await supabase.from("affiliates").insert({
      name: addForm.name,
      email: addForm.email,
      instagram: addForm.instagram || null,
      channel_type: addForm.channel_type,
      commission_percent: addForm.commission_percent,
      pix_key: addForm.pix_key || null,
      ref_slug: refSlug,
      coupon_code: couponCode,
      status: addForm.autoApprove ? "active" : "pending",
      approved_at: addForm.autoApprove ? new Date().toISOString() : null,
      user_id: userId,
    });

    if (error) {
      toast.error("Erro ao adicionar afiliado: " + error.message);
    } else {
      toast.success(`${addForm.name} adicionado${addForm.autoApprove ? " e aprovado" : ""}!`);
      log({ action: "create", entity_type: "affiliate", entity_id: "new", details: { name: addForm.name, autoApprove: addForm.autoApprove } });
      setShowAddDialog(false);
      setAddForm({ name: "", email: "", instagram: "", channel_type: "influencer", commission_percent: 10, pix_key: "", autoApprove: false });
      loadData();
    }
  };

  const filtered = affiliates.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = affiliates.filter((a) => a.status === "active").length;
  const pendingCount = affiliates.filter((a) => a.status === "pending").length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.order_total, 0);
  const totalCommissions = sales.reduce((sum, s) => sum + s.commission_amount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  const channelLabels: Record<string, string> = {
    influencer: "Influenciador",
    partner: "Parceiro",
    creator: "Creator",
    vet: "Veterinário",
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Handshake className="w-6 h-6 text-primary" /> Programa de Afiliados
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie parceiros, influenciadores e comissões.</p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Adicionar Afiliado
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Ativos", value: activeCount, icon: Users, color: "text-green-500" },
            { label: "Pendentes", value: pendingCount, icon: Clock, color: "text-yellow-500" },
            { label: "Receita Gerada", value: `R$ ${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-blue-500" },
            { label: "Comissões Totais", value: `R$ ${totalCommissions.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
            { label: "Saques Pendentes", value: pendingPayouts.length, icon: Wallet, color: "text-orange-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <kpi.icon className={`w-5 h-5 ${kpi.color} mb-1`} />
              <p className="text-xl font-black text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Pending payouts */}
        {pendingPayouts.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500" /> Saques Pendentes ({pendingPayouts.length})
            </h3>
            <div className="space-y-2">
              {pendingPayouts.map((p) => {
                const aff = affiliates.find((a) => a.id === p.affiliate_id);
                return (
                  <div key={p.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{aff?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">R$ {p.amount.toFixed(2).replace(".", ",")} · Pix: {p.pix_key || "não informado"}</p>
                    </div>
                    <button onClick={() => handleMarkPayoutPaid(p)} className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600">
                      Marcar como Pago
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Buscar por nome ou email..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>

        {/* Affiliates table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden md:table-cell">Canal</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground hidden lg:table-cell">Cupom</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground">Comissão</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground">Ganho</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((aff) => {
                  const affSales = sales.filter((s) => s.affiliate_id === aff.id);
                  return (
                    <tr key={aff.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{aff.name}</p>
                        <p className="text-xs text-muted-foreground">{aff.email}</p>
                        {aff.instagram && <p className="text-xs text-primary">@{aff.instagram.replace("@", "")}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{channelLabels[aff.channel_type] || aff.channel_type}</td>
                      <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-foreground">{aff.coupon_code || "—"}</td>
                      <td className="px-4 py-3 text-foreground font-bold">{aff.commission_percent}%</td>
                      <td className="px-4 py-3 text-foreground">
                        R$ {aff.total_earned.toFixed(2).replace(".", ",")}
                        <span className="text-xs text-muted-foreground block">{affSales.length} vendas</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          aff.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          aff.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {aff.status === "active" ? "Ativo" : aff.status === "pending" ? "Pendente" : "Suspenso"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {aff.status === "pending" && (
                            <button onClick={() => handleApprove(aff)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg" title="Aprovar">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {aff.status === "active" && (
                            <button onClick={() => handleSuspend(aff)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg" title="Suspender">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {aff.status === "suspended" && (
                            <button onClick={() => handleReactivate(aff)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg" title="Reativar">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openAffiliateDetail(aff)}
                            className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg"
                            title="Editar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(aff)}
                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum afiliado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Nome</label>
                  <input
                    value={editFields.name}
                    onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    value={editFields.email}
                    onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Instagram</label>
                  <input
                    value={editFields.instagram}
                    onChange={(e) => setEditFields({ ...editFields, instagram: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="@usuario"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Canal</label>
                  <select
                    value={editFields.channel_type}
                    onChange={(e) => setEditFields({ ...editFields, channel_type: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="influencer">Influenciador</option>
                    <option value="partner">Parceiro</option>
                    <option value="creator">Creator</option>
                    <option value="vet">Veterinário</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Chave Pix</label>
                  <input
                    value={editFields.pix_key}
                    onChange={(e) => setEditFields({ ...editFields, pix_key: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="CPF, email ou telefone"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Comissão (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editCommission}
                    onChange={(e) => setEditCommission(Number(e.target.value))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-3">
                <div><span className="text-muted-foreground">Cupom:</span> <span className="font-mono font-bold text-foreground">{selectedAffiliate.coupon_code || "—"}</span></div>
                <div><span className="text-muted-foreground">Ref:</span> <span className="font-mono text-foreground">{selectedAffiliate.ref_slug || "—"}</span></div>
                <div><span className="text-muted-foreground">Total ganho:</span> <span className="font-bold text-green-600">R$ {selectedAffiliate.total_earned.toFixed(2).replace(".", ",")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="font-bold text-foreground">{selectedAffiliate.status === "active" ? "Ativo" : selectedAffiliate.status === "pending" ? "Pendente" : "Suspenso"}</span></div>
              </div>

              <div className="flex gap-2">
                <button onClick={async () => { await handleSaveEditFields(); await handleUpdateCommission(); }} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">
                  Salvar Alterações
                </button>
              </div>

              {/* Sales */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-2">Vendas recentes</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sales.filter((s) => s.affiliate_id === selectedAffiliate.id).slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-muted rounded-lg p-2">
                      <span>{format(new Date(s.created_at), "dd/MM/yy")}</span>
                      <span>R$ {s.order_total.toFixed(2)}</span>
                      <span className="text-green-600 font-bold">R$ {s.commission_amount.toFixed(2)}</span>
                      <span className={`font-bold ${s.status === "confirmed" ? "text-blue-500" : s.status === "paid" ? "text-green-500" : "text-yellow-500"}`}>
                        {s.status === "confirmed" ? "✓" : s.status === "paid" ? "💰" : "⏳"}
                      </span>
                      {s.status === "pending" && (
                        <button onClick={() => handleConfirmSale(s)} className="text-blue-500 text-[10px] font-bold hover:underline">Confirmar</button>
                      )}
                    </div>
                  ))}
                  {sales.filter((s) => s.affiliate_id === selectedAffiliate.id).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Sem vendas</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Affiliate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-1 block">Nome *</label>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-1 block">Email *</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Instagram</label>
                <input
                  value={addForm.instagram}
                  onChange={(e) => setAddForm({ ...addForm, instagram: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Tipo de Canal</label>
                <select
                  value={addForm.channel_type}
                  onChange={(e) => setAddForm({ ...addForm, channel_type: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="influencer">Influenciador</option>
                  <option value="partner">Parceiro</option>
                  <option value="creator">Creator</option>
                  <option value="vet">Veterinário</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Comissão (%)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={addForm.commission_percent}
                  onChange={(e) => setAddForm({ ...addForm, commission_percent: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Chave Pix</label>
                <input
                  value={addForm.pix_key}
                  onChange={(e) => setAddForm({ ...addForm, pix_key: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  placeholder="CPF, email ou telefone"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.autoApprove}
                onChange={(e) => setAddForm({ ...addForm, autoApprove: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Aprovar automaticamente (gera cupom e link)</span>
            </label>
            <button
              onClick={handleAddAffiliate}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
            >
              Adicionar Afiliado
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
