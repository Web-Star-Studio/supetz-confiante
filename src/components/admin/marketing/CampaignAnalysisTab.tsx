import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Eye, Users, Percent, Send,
  Megaphone, Loader2, ArrowUpRight, ArrowDownRight, Trophy,
  Calendar,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Progress } from "@/components/ui/progress";

interface CampaignData {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  recipients_count: number;
  opened: number;
  total: number;
  couponsUsed: number;
  couponsTotal: number;
  openRate: number;
  couponRate: number;
}

export default function CampaignAnalysisTab() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [campRes, recipRes] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("campaign_recipients").select("campaign_id, opened, coupon_id"),
      ]);

      const camps = campRes.data || [];
      const recipients = recipRes.data || [];

      const couponIds = recipients.map((r: any) => r.coupon_id).filter(Boolean);
      let usedSet = new Set<string>();
      if (couponIds.length > 0) {
        const { data } = await supabase.from("user_coupons").select("id").eq("used", true).in("id", couponIds);
        usedSet = new Set((data || []).map((c: any) => c.id));
      }

      const enriched: CampaignData[] = camps
        .filter(c => c.status !== "draft")
        .map((c: any) => {
          const recs = recipients.filter((r: any) => r.campaign_id === c.id);
          const opened = recs.filter((r: any) => r.opened).length;
          const withCoupon = recs.filter((r: any) => r.coupon_id);
          const couponsUsed = withCoupon.filter((r: any) => usedSet.has(r.coupon_id)).length;
          return {
            id: c.id,
            name: c.name,
            type: c.type,
            status: c.status,
            created_at: c.created_at,
            sent_at: c.sent_at,
            recipients_count: c.recipients_count || 0,
            opened,
            total: recs.length,
            couponsUsed,
            couponsTotal: withCoupon.length,
            openRate: recs.length > 0 ? (opened / recs.length) * 100 : 0,
            couponRate: withCoupon.length > 0 ? (couponsUsed / withCoupon.length) * 100 : 0,
          };
        });

      setCampaigns(enriched);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    if (!campaigns.length) return null;
    const totalRecipients = campaigns.reduce((s, c) => s + c.total, 0);
    const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0);
    const avgOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients) * 100 : 0;
    const bestCampaign = [...campaigns].sort((a, b) => b.openRate - a.openRate)[0];
    const worstCampaign = [...campaigns].sort((a, b) => a.openRate - b.openRate)[0];

    // Performance trend (last 6 campaigns)
    const last6 = campaigns.slice(0, 6).reverse();

    // Type distribution
    const typeDist: Record<string, number> = {};
    campaigns.forEach(c => { typeDist[c.type] = (typeDist[c.type] || 0) + 1; });

    // Monthly data
    const monthlyMap: Record<string, { campaigns: number; recipients: number; opens: number }> = {};
    campaigns.forEach(c => {
      const month = c.created_at.slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { campaigns: 0, recipients: 0, opens: 0 };
      monthlyMap[month].campaigns += 1;
      monthlyMap[month].recipients += c.total;
      monthlyMap[month].opens += c.opened;
    });
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, d]) => ({
        month: month.split("-").reverse().join("/"),
        campanhas: d.campaigns,
        alcance: d.recipients,
        aberturas: d.opens,
        taxa: d.recipients > 0 ? Math.round((d.opens / d.recipients) * 100) : 0,
      }));

    return { totalRecipients, totalOpened, avgOpenRate, bestCampaign, worstCampaign, last6, typeDist, monthlyData };
  }, [campaigns]);

  const compared = useMemo(() => {
    if (selectedIds.length < 2) return null;
    return campaigns.filter(c => selectedIds.includes(c.id));
  }, [campaigns, selectedIds]);

  function toggleCompare(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? prev : [...prev, id]
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!stats) {
    return <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">Nenhuma campanha enviada ainda.</div>;
  }

  const typeLabels: Record<string, string> = { notification: "Notificação", coupon: "Cupom", both: "Ambos" };
  const pieColors = ["hsl(var(--primary))", "#8b5cf6", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Campanhas enviadas", value: campaigns.length, icon: Megaphone, color: "bg-primary/15 text-primary" },
          { label: "Total alcançados", value: stats.totalRecipients, icon: Users, color: "bg-emerald-500/15 text-emerald-600" },
          { label: "Taxa média abertura", value: `${stats.avgOpenRate.toFixed(1)}%`, icon: Eye, color: "bg-violet-500/15 text-violet-600" },
          { label: "Melhor campanha", value: stats.bestCampaign?.openRate ? `${stats.bestCampaign.openRate.toFixed(0)}%` : "—", icon: Trophy, color: "bg-amber-500/15 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-3xl p-5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend + Type Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Tendência Mensal
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="taxa" name="Taxa abertura %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="alcance" name="Alcance" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Distribuição por Tipo
          </p>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={Object.entries(stats.typeDist).map(([k, v]) => ({ name: typeLabels[k] || k, value: v }))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {Object.keys(stats.typeDist).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best vs Worst */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "🏆 Melhor Performance", camp: stats.bestCampaign, color: "text-emerald-600", icon: ArrowUpRight },
          { label: "⚠️ Menor Performance", camp: stats.worstCampaign, color: "text-orange-600", icon: ArrowDownRight },
        ].map(({ label, camp, color, icon: Icon }) => camp && (
          <div key={label} className="bg-card rounded-3xl p-5">
            <p className="text-sm font-bold text-foreground mb-3">{label}</p>
            <div className="flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{camp.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">{camp.total} enviados</span>
                  <span className={`text-xs font-bold ${color}`}>{camp.openRate.toFixed(1)}% abertura</span>
                  {camp.couponsTotal > 0 && <span className="text-xs text-muted-foreground">{camp.couponRate.toFixed(0)}% cupom</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Comparison */}
      <div className="bg-card rounded-3xl p-5">
        <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Comparar Campanhas
        </p>
        <p className="text-xs text-muted-foreground mb-4">Selecione 2–4 campanhas para comparar lado a lado</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {campaigns.slice(0, 12).map(c => (
            <button
              key={c.id}
              onClick={() => toggleCompare(c.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                selectedIds.includes(c.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {compared && compared.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase">
                  <th className="pb-3 pr-4">Métrica</th>
                  {compared.map(c => <th key={c.id} className="pb-3 pr-4">{c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Destinatários", key: "total" },
                  { label: "Aberturas", key: "opened" },
                  { label: "Taxa abertura", key: "openRate", fmt: (v: number) => `${v.toFixed(1)}%` },
                  { label: "Cupons usados", key: "couponsUsed" },
                  { label: "Taxa cupom", key: "couponRate", fmt: (v: number) => `${v.toFixed(1)}%` },
                ].map(({ label, key, fmt }) => (
                  <tr key={key} className="border-t border-border/30">
                    <td className="py-2 pr-4 font-semibold text-foreground text-xs">{label}</td>
                    {compared.map(c => {
                      const val = (c as any)[key];
                      const best = Math.max(...compared.map(x => (x as any)[key]));
                      return (
                        <td key={c.id} className={`py-2 pr-4 text-xs ${val === best && compared.length > 1 ? "text-emerald-600 font-bold" : "text-foreground"}`}>
                          {fmt ? fmt(val) : val}
                          {val === best && compared.length > 1 && " 🏆"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="bg-card rounded-3xl p-5">
        <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Ranking de Campanhas (por abertura)
        </p>
        <div className="space-y-2">
          {[...campaigns].sort((a, b) => b.openRate - a.openRate).slice(0, 10).map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === 0 ? "bg-amber-500/15 text-amber-600" : i === 1 ? "bg-muted text-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{c.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{c.total} env.</span>
                <div className="w-20">
                  <Progress value={c.openRate} className="h-1.5" />
                </div>
                <span className="font-bold text-foreground w-12 text-right">{c.openRate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
