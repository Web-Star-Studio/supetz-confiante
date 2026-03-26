import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Mail, Send, ShieldOff, AlertTriangle, Eye, CheckCircle2,
  XCircle, Loader2, ChevronDown, ChevronUp, MailWarning,
  Settings2, BellRing, Save,
} from "lucide-react";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  template_id: string | null;
  status: string;
  sent_at: string | null;
  recipients_count: number | null;
}

interface CampaignRecipient {
  campaign_id: string;
  opened: boolean | null;
  sent_at: string | null;
}

interface CampaignEmailStats {
  campaignId: string;
  campaignName: string;
  sentAt: string | null;
  totalRecipients: number;
  opened: number;
  openRate: string;
  emailsSent: number;
  emailsFailed: number;
  emailsSuppressed: number;
  deliveryRate: string;
}

export default function EmailAnalyticsPanel() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (period === "7d" ? 7 : period === "30d" ? 30 : 90));

      const [logRes, campRes, recipRes] = await Promise.all([
        supabase
          .from("email_send_log")
          .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
          .gte("created_at", cutoff.toISOString())
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("campaigns")
          .select("id, name, template_id, status, sent_at, recipients_count")
          .in("status", ["active", "completed", "sending"])
          .order("sent_at", { ascending: false }),
        supabase
          .from("campaign_recipients")
          .select("campaign_id, opened, sent_at"),
      ]);

      setLogs((logRes.data || []) as EmailLog[]);
      setCampaigns((campRes.data || []) as Campaign[]);
      setRecipients((recipRes.data || []) as CampaignRecipient[]);
      setLoading(false);
    })();
  }, [period]);

  // Deduplicate email logs by message_id
  const dedupedLogs = useMemo(() => {
    const map = new Map<string, EmailLog>();
    logs.forEach((log) => {
      const key = log.message_id || log.id;
      if (!map.has(key) || new Date(log.created_at) > new Date(map.get(key)!.created_at)) {
        map.set(key, log);
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Global email stats
  const globalStats = useMemo(() => {
    const sent = dedupedLogs.filter((l) => l.status === "sent").length;
    const failed = dedupedLogs.filter((l) => l.status === "dlq" || l.status === "failed").length;
    const suppressed = dedupedLogs.filter((l) => l.status === "suppressed").length;
    const pending = dedupedLogs.filter((l) => l.status === "pending").length;
    const bounced = dedupedLogs.filter((l) => l.status === "bounced").length;
    const complained = dedupedLogs.filter((l) => l.status === "complained").length;
    const total = dedupedLogs.length;
    const deliveryRate = total > 0 ? ((sent / total) * 100).toFixed(1) : "0";

    // By template
    const byTemplate: Record<string, { sent: number; failed: number; suppressed: number; total: number }> = {};
    dedupedLogs.forEach((l) => {
      const t = l.template_name || "unknown";
      if (!byTemplate[t]) byTemplate[t] = { sent: 0, failed: 0, suppressed: 0, total: 0 };
      byTemplate[t].total++;
      if (l.status === "sent") byTemplate[t].sent++;
      if (l.status === "dlq" || l.status === "failed") byTemplate[t].failed++;
      if (l.status === "suppressed") byTemplate[t].suppressed++;
    });

    // Daily trend
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const now = new Date();
    const daily: { date: string; label: string; sent: number; failed: number; suppressed: number }[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayLogs = dedupedLogs.filter((l) => l.created_at.startsWith(ds));
      daily.push({
        date: ds,
        label,
        sent: dayLogs.filter((l) => l.status === "sent").length,
        failed: dayLogs.filter((l) => l.status === "dlq" || l.status === "failed").length,
        suppressed: dayLogs.filter((l) => l.status === "suppressed").length,
      });
    }

    return { sent, failed, suppressed, pending, bounced, complained, total, deliveryRate, byTemplate, daily };
  }, [dedupedLogs, period]);

  // Per-campaign stats
  const campaignStats = useMemo<CampaignEmailStats[]>(() => {
    return campaigns.map((c) => {
      const campRecips = recipients.filter((r) => r.campaign_id === c.id);
      const totalRecipients = campRecips.length || c.recipients_count || 0;
      const opened = campRecips.filter((r) => r.opened).length;
      const openRate = totalRecipients > 0 ? ((opened / totalRecipients) * 100).toFixed(1) : "0";

      // Match email logs for this campaign (by send time proximity or campaign-related template)
      const campSentAt = c.sent_at ? new Date(c.sent_at) : null;
      let campaignLogs: EmailLog[] = [];
      if (campSentAt) {
        const windowStart = new Date(campSentAt.getTime() - 5 * 60000);
        const windowEnd = new Date(campSentAt.getTime() + 60 * 60000);
        campaignLogs = dedupedLogs.filter((l) => {
          const t = new Date(l.created_at);
          return t >= windowStart && t <= windowEnd && l.template_name === "send-campaign-emails";
        });
      }

      const emailsSent = campaignLogs.filter((l) => l.status === "sent").length;
      const emailsFailed = campaignLogs.filter((l) => l.status === "dlq" || l.status === "failed").length;
      const emailsSuppressed = campaignLogs.filter((l) => l.status === "suppressed").length;
      const totalEmails = emailsSent + emailsFailed + emailsSuppressed;
      const deliveryRate = totalEmails > 0 ? ((emailsSent / totalEmails) * 100).toFixed(1) : "—";

      return {
        campaignId: c.id,
        campaignName: c.name,
        sentAt: c.sent_at,
        totalRecipients,
        opened,
        openRate,
        emailsSent,
        emailsFailed,
        emailsSuppressed,
        deliveryRate,
      };
    });
  }, [campaigns, recipients, dedupedLogs]);

  // Recent failures
  const recentFailures = useMemo(() => {
    return dedupedLogs
      .filter((l) => l.status === "dlq" || l.status === "failed")
      .slice(0, 5);
  }, [dedupedLogs]);

  const chartSampled = globalStats.daily.length > 30
    ? globalStats.daily.filter((_, i) => i % Math.ceil(globalStats.daily.length / 30) === 0 || i === globalStats.daily.length - 1)
    : globalStats.daily;
  const maxChart = Math.max(1, ...chartSampled.map((d) => d.sent + d.failed + d.suppressed));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-extrabold text-foreground">Analytics de E-mails</h3>
        </div>
        <div className="flex gap-1 bg-card rounded-2xl p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total enviados", value: globalStats.sent, icon: Send, color: "bg-emerald-500/15 text-emerald-600" },
          { label: "Taxa entrega", value: `${globalStats.deliveryRate}%`, icon: CheckCircle2, color: "bg-blue-500/15 text-blue-600" },
          { label: "Suprimidos", value: globalStats.suppressed, icon: ShieldOff, color: "bg-amber-500/15 text-amber-600" },
          { label: "Falhados", value: globalStats.failed, icon: XCircle, color: globalStats.failed > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-5"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary status badges */}
      {(globalStats.bounced > 0 || globalStats.complained > 0 || globalStats.pending > 0) && (
        <div className="flex flex-wrap gap-2">
          {globalStats.pending > 0 && (
            <span className="text-xs font-semibold bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full">
              ⏳ {globalStats.pending} pendentes
            </span>
          )}
          {globalStats.bounced > 0 && (
            <span className="text-xs font-semibold bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">
              ↩️ {globalStats.bounced} bounces
            </span>
          )}
          {globalStats.complained > 0 && (
            <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full">
              ⚠️ {globalStats.complained} complaints
            </span>
          )}
        </div>
      )}

      {/* Email volume chart */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" /> Volume de e-mails
          </p>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Enviados</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Falhados</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Suprimidos</span>
          </div>
        </div>
        <div className="flex items-end gap-[2px] h-28">
          {chartSampled.map((day, i) => {
            const total = day.sent + day.failed + day.suppressed;
            const h = (total / maxChart) * 100;
            const sentH = total > 0 ? (day.sent / total) * h : 0;
            const failH = total > 0 ? (day.failed / total) * h : 0;
            const suppH = total > 0 ? (day.suppressed / total) * h : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${day.label}: ${total}`}>
                <span className="text-[8px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">{total}</span>
                <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: `${Math.max(h, 2)}%` }}>
                  {sentH > 0 && <div className="bg-emerald-500/80" style={{ height: `${sentH}%`, minHeight: "1px" }} />}
                  {failH > 0 && <div className="bg-destructive/80" style={{ height: `${failH}%`, minHeight: "1px" }} />}
                  {suppH > 0 && <div className="bg-amber-500/80" style={{ height: `${suppH}%`, minHeight: "1px" }} />}
                </div>
                {(i === 0 || i === chartSampled.length - 1 || i % Math.ceil(chartSampled.length / 6) === 0) && (
                  <span className="text-[8px] text-muted-foreground mt-0.5">{day.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-campaign breakdown */}
      <div className="bg-card rounded-3xl p-5">
        <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> E-mails por campanha
        </p>
        {campaignStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma campanha enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {campaignStats.map((cs) => {
              const isExpanded = expandedCampaign === cs.campaignId;
              return (
                <div key={cs.campaignId} className="rounded-2xl border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setExpandedCampaign(isExpanded ? null : cs.campaignId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{cs.campaignName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {cs.sentAt ? new Date(cs.sentAt).toLocaleDateString("pt-BR") : "—"} · {cs.totalRecipients} destinatários
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 font-semibold">{cs.openRate}% abertura</span>
                        <span className="text-muted-foreground">{cs.emailsSent} env.</span>
                        {cs.emailsFailed > 0 && <span className="text-destructive font-semibold">{cs.emailsFailed} falhas</span>}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-4 pb-4 border-t border-border/30"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
                        {[
                          { label: "Destinatários", value: cs.totalRecipients, color: "text-foreground" },
                          { label: "Aberturas", value: `${cs.opened} (${cs.openRate}%)`, color: "text-violet-600" },
                          { label: "Enviados", value: cs.emailsSent, color: "text-emerald-600" },
                          { label: "Falhados", value: cs.emailsFailed, color: cs.emailsFailed > 0 ? "text-destructive" : "text-muted-foreground" },
                          { label: "Suprimidos", value: cs.emailsSuppressed, color: cs.emailsSuppressed > 0 ? "text-amber-600" : "text-muted-foreground" },
                        ].map((m) => (
                          <div key={m.label} className="text-center bg-muted/50 rounded-xl p-3">
                            <p className={`text-lg font-extrabold ${m.color}`}>{m.value}</p>
                            <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          </div>
                        ))}
                      </div>
                      {cs.deliveryRate !== "—" && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Taxa de entrega</span>
                            <span className="font-bold text-foreground">{cs.deliveryRate}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-emerald-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${cs.deliveryRate}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* By template */}
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> E-mails por tipo
          </p>
          {Object.keys(globalStats.byTemplate).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum e-mail registrado.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(globalStats.byTemplate)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([template, stats]) => {
                  const pct = globalStats.total > 0 ? ((stats.total / globalStats.total) * 100).toFixed(0) : 0;
                  return (
                    <div key={template}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[60%]">{template}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-emerald-600">{stats.sent} ✓</span>
                          {stats.failed > 0 && <span className="text-destructive">{stats.failed} ✗</span>}
                          {stats.suppressed > 0 && <span className="text-amber-600">{stats.suppressed} ⊘</span>}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-blue-500/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Recent failures */}
        <div className="bg-card rounded-3xl p-5">
          <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <MailWarning className="w-4 h-4 text-destructive" /> Falhas recentes
          </p>
          {recentFailures.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma falha no período. 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFailures.map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{f.recipient_email}</p>
                    <p className="text-[10px] text-muted-foreground">{f.template_name} · {new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                    {f.error_message && (
                      <p className="text-[10px] text-destructive mt-0.5 truncate">{f.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
