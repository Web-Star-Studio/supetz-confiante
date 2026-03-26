import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, Mail, Zap, Bell, Ticket,
  Send, Eye, Percent, Activity, ArrowUpRight, ArrowDownRight,
  Megaphone, Calendar, UserPlus, Loader2,
} from "lucide-react";
import EmailAnalyticsPanel from "./EmailAnalyticsPanel";

interface AnalyticsData {
  campaigns: any[];
  recipients: any[];
  automations: any[];
  executions: any[];
  subscribers: any[];
  emailLogs: any[];
  couponsUsed: number;
  couponsTotal: number;
}

export default function MarketingAnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (period === "7d" ? 7 : period === "30d" ? 30 : 90));
      const cutoffStr = cutoff.toISOString();

      const [campRes, recipRes, autoRes, execRes, subRes, logRes] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("campaign_recipients").select("campaign_id, opened, coupon_id, sent_at"),
        supabase.from("marketing_automations").select("*"),
        supabase.from("automation_executions").select("*").gte("created_at", cutoffStr).order("created_at", { ascending: false }),
        supabase.from("newsletter_subscribers").select("id, status, subscribed_at, source, unsubscribed_at"),
        supabase.from("email_send_log").select("id, message_id, template_name, status, created_at").gte("created_at", cutoffStr).order("created_at", { ascending: false }).limit(1000),
      ]);

      const recipients = recipRes.data || [];
      const couponIds = recipients.map((r: any) => r.coupon_id).filter(Boolean);
      let usedCount = 0;
      if (couponIds.length > 0) {
        const { count } = await supabase.from("user_coupons").select("id", { count: "exact", head: true }).eq("used", true).in("id", couponIds);
        usedCount = count || 0;
      }

      setData({
        campaigns: campRes.data || [],
        recipients,
        automations: autoRes.data || [],
        executions: execRes.data || [],
        subscribers: subRes.data || [],
        emailLogs: logRes.data || [],
        couponsUsed: usedCount,
        couponsTotal: couponIds.length,
      });
      setLoading(false);
    })();
  }, [period]);

  const metrics = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - periodDays);
    const prevCutoff = new Date(cutoff);
    prevCutoff.setDate(prevCutoff.getDate() - periodDays);

    // Campaigns
    const campsInPeriod = data.campaigns.filter((c) => new Date(c.created_at) >= cutoff);
    const campsSent = data.campaigns.filter((c) => c.status === "active" || c.status === "completed");

    // Recipients / opens
    const totalRecipients = data.recipients.length;
    const totalOpened = data.recipients.filter((r: any) => r.opened).length;
    const openRate = totalRecipients > 0 ? ((totalOpened / totalRecipients) * 100).toFixed(1) : "0";
    const couponConversion = data.couponsTotal > 0 ? ((data.couponsUsed / data.couponsTotal) * 100).toFixed(1) : "0";

    // Automations
    const activeAutomations = data.automations.filter((a) => a.enabled).length;
    const totalExecs = data.executions.length;
    const uniqueAutoUsers = new Set(data.executions.map((e: any) => e.user_id)).size;

    // Newsletter
    const activeSubs = data.subscribers.filter((s) => s.status === "active").length;
    const newSubsInPeriod = data.subscribers.filter((s) => new Date(s.subscribed_at) >= cutoff).length;
    const prevNewSubs = data.subscribers.filter((s) => {
      const d = new Date(s.subscribed_at);
      return d >= prevCutoff && d < cutoff;
    }).length;
    const subsGrowth = prevNewSubs > 0 ? (((newSubsInPeriod - prevNewSubs) / prevNewSubs) * 100).toFixed(0) : newSubsInPeriod > 0 ? "100" : "0";

    // Emails (deduplicated by message_id)
    const deduped = new Map<string, any>();
    data.emailLogs.forEach((log: any) => {
      const key = log.message_id || log.id;
      if (!deduped.has(key) || new Date(log.created_at) > new Date(deduped.get(key).created_at)) {
        deduped.set(key, log);
      }
    });
    const uniqueEmails = Array.from(deduped.values());
    const emailsSent = uniqueEmails.filter((e) => e.status === "sent").length;
    const emailsFailed = uniqueEmails.filter((e) => e.status === "dlq" || e.status === "failed").length;
    const emailsSuppressed = uniqueEmails.filter((e) => e.status === "suppressed").length;

    // Daily data for chart
    const dailyData: { date: string; label: string; campaigns: number; automations: number; emails: number; subscribers: number }[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dailyData.push({
        date: ds,
        label,
        campaigns: data.recipients.filter((r: any) => r.sent_at?.startsWith(ds)).length,
        automations: data.executions.filter((e: any) => e.created_at.startsWith(ds)).length,
        emails: uniqueEmails.filter((e) => e.created_at.startsWith(ds)).length,
        subscribers: data.subscribers.filter((s) => s.subscribed_at.startsWith(ds)).length,
      });
    }

    // Source breakdown
    const sourceMap: Record<string, number> = {};
    data.subscribers.filter((s) => s.status === "active").forEach((s) => {
      sourceMap[s.source] = (sourceMap[s.source] || 0) + 1;
    });

    // Execution by trigger type
    const triggerMap: Record<string, number> = {};
    data.executions.forEach((e: any) => {
      const trigger = e.metadata?.trigger_type || "unknown";
      triggerMap[trigger] = (triggerMap[trigger] || 0) + 1;
    });

    return {
      campsInPeriod: campsInPeriod.length,
      campsSent: campsSent.length,
      totalRecipients,
      totalOpened,
      openRate,
      couponConversion,
      activeAutomations,
      totalAutomations: data.automations.length,
      totalExecs,
      uniqueAutoUsers,
      activeSubs,
      newSubsInPeriod,
      subsGrowth: Number(subsGrowth),
      emailsSent,
      emailsFailed,
      emailsSuppressed,
      totalUniqueEmails: uniqueEmails.length,
      dailyData,
      sourceMap,
      triggerMap,
    };
  }, [data, period]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxDaily = Math.max(1, ...metrics.dailyData.map((d) => d.campaigns + d.automations + d.emails));
  const chartSampled = metrics.dailyData.length > 30
    ? metrics.dailyData.filter((_, i) => i % Math.ceil(metrics.dailyData.length / 30) === 0 || i === metrics.dailyData.length - 1)
    : metrics.dailyData;
  const maxSampled = Math.max(1, ...chartSampled.map((d) => d.campaigns + d.automations + d.emails));

  const sourceColors: Record<string, string> = {
    footer: "#f59e0b",
    landing: "#3b82f6",
    registration: "#10b981",
    referral: "#8b5cf6",
  };

  const triggerLabels: Record<string, string> = {
    pet_birthday: "Aniversário",
    inactive_customer: "Inativo",
    post_purchase: "Pós-compra",
    welcome_no_purchase: "Boas-vindas",
    post_delivery: "Pós-entrega",
    restock_reminder: "Reposição",
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">Analytics Unificado</h3>
        </div>
        <div className="flex gap-1 bg-card rounded-2xl p-1">
          {([
            { key: "7d" as const, label: "7 dias" },
            { key: "30d" as const, label: "30 dias" },
            { key: "90d" as const, label: "90 dias" },
          ]).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Campanhas enviadas", value: metrics.campsSent, icon: Megaphone, color: "bg-primary/15 text-primary" },
          { label: "Automações ativas", value: `${metrics.activeAutomations}/${metrics.totalAutomations}`, icon: Zap, color: "bg-violet-500/15 text-violet-600" },
          { label: "Assinantes ativos", value: metrics.activeSubs, icon: Users, color: "bg-emerald-500/15 text-emerald-600", badge: metrics.newSubsInPeriod > 0 ? `+${metrics.newSubsInPeriod}` : null },
          { label: "E-mails enviados", value: metrics.emailsSent, icon: Mail, color: "bg-blue-500/15 text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              {"badge" in s && s.badge && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {s.badge}
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Taxa abertura", value: `${metrics.openRate}%`, icon: Eye, color: "text-violet-600" },
          { label: "Conversão cupons", value: `${metrics.couponConversion}%`, icon: Percent, color: "text-amber-600" },
          { label: "Execuções auto.", value: metrics.totalExecs, icon: Activity, color: "text-primary" },
          { label: "Usuários impactados", value: metrics.uniqueAutoUsers, icon: UserPlus, color: "text-emerald-600" },
          { label: "E-mails falhados", value: metrics.emailsFailed, icon: Mail, color: metrics.emailsFailed > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 flex items-center gap-3">
            <s.icon className={`w-4 h-4 flex-shrink-0 ${s.color}`} />
            <div>
              <p className="text-sm font-extrabold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Atividade diária</p>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Campanhas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Automações</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> E-mails</span>
          </div>
        </div>
        <div className="flex items-end gap-[2px] h-32">
          {chartSampled.map((day, i) => {
            const total = day.campaigns + day.automations + day.emails;
            const h = (total / maxSampled) * 100;
            const campH = total > 0 ? (day.campaigns / total) * h : 0;
            const autoH = total > 0 ? (day.automations / total) * h : 0;
            const emailH = total > 0 ? (day.emails / total) * h : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${day.label}: ${total} ações`}>
                <span className="text-[8px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">{total}</span>
                <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: `${Math.max(h, 2)}%` }}>
                  {campH > 0 && <div className="bg-primary/80" style={{ height: `${campH}%`, minHeight: "1px" }} />}
                  {autoH > 0 && <div className="bg-violet-500/80" style={{ height: `${autoH}%`, minHeight: "1px" }} />}
                  {emailH > 0 && <div className="bg-blue-500/80" style={{ height: `${emailH}%`, minHeight: "1px" }} />}
                </div>
                {(i === 0 || i === chartSampled.length - 1 || i % Math.ceil(chartSampled.length / 6) === 0) && (
                  <span className="text-[8px] text-muted-foreground mt-0.5">{day.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Newsletter sources */}
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Fontes de assinantes
          </p>
          <div className="space-y-3">
            {Object.entries(metrics.sourceMap).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
              const pct = metrics.activeSubs > 0 ? ((count / metrics.activeSubs) * 100).toFixed(0) : 0;
              const color = sourceColors[source] || "#6b7280";
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground capitalize">{source}</span>
                    <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(metrics.sourceMap).length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum assinante ativo.</p>
            )}
          </div>
          {metrics.subsGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1.5">
              {metrics.subsGrowth > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={`text-xs font-bold ${metrics.subsGrowth > 0 ? "text-emerald-600" : "text-destructive"}`}>
                {metrics.subsGrowth > 0 ? "+" : ""}{metrics.subsGrowth}% vs período anterior
              </span>
            </div>
          )}
        </div>

        {/* Automation triggers breakdown */}
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" /> Execuções por gatilho
          </p>
          {Object.keys(metrics.triggerMap).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma execução no período.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(metrics.triggerMap).sort((a, b) => b[1] - a[1]).map(([trigger, count]) => {
                const pct = metrics.totalExecs > 0 ? ((count / metrics.totalExecs) * 100).toFixed(0) : 0;
                return (
                  <div key={trigger} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground w-24 truncate">
                      {triggerLabels[trigger] || trigger}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-violet-500/70"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Email health summary */}
          <div className="mt-5 pt-4 border-t border-border/50">
            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> Saúde dos e-mails
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Enviados", value: metrics.emailsSent, color: "text-emerald-600" },
                { label: "Falhados", value: metrics.emailsFailed, color: metrics.emailsFailed > 0 ? "text-destructive" : "text-muted-foreground" },
                { label: "Suprimidos", value: metrics.emailsSuppressed, color: metrics.emailsSuppressed > 0 ? "text-amber-600" : "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email Analytics Panel */}
      <EmailAnalyticsPanel />
    </div>
  );
}
