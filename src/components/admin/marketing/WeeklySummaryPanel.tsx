import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Megaphone, Zap, Mail, Users,
  Eye, ChevronDown, ChevronUp, Loader2, FileBarChart, Download, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface WeeklySummary {
  id: string;
  week_start: string;
  week_end: string;
  summary: {
    campaigns_created: number;
    campaigns_sent: number;
    recipients_reached: number;
    open_rate: number;
    automations_active: number;
    automation_executions: number;
    new_subscribers: number;
    unsubscribes: number;
    emails_sent: number;
    emails_failed: number;
  };
  created_at: string;
}

export default function WeeklySummaryPanel() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("weekly_marketing_summaries")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(12);
      if (data) setSummaries(data as WeeklySummary[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-3xl p-6 flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const formatDateFull = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const exportPDF = async () => {
    if (summaries.length === 0) return;
    toast.info("Gerando PDF...");

    // Build HTML for PDF
    const rows = summaries.map((s) => {
      const d = s.summary;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDateFull(s.week_start)} — ${formatDateFull(s.week_end)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.campaigns_sent}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.recipients_reached}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.open_rate}%</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.emails_sent}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.emails_failed}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${d.automation_executions}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">+${d.new_subscribers} / -${d.unsubscribes}</td>
        </tr>`;
    }).join("");

    const html = `
      <html><head><title>Resumos Semanais de Marketing</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #f97316; color: white; padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        th:first-child { text-align: left; border-radius: 8px 0 0 0; }
        th:last-child { border-radius: 0 8px 0 0; }
        tr:nth-child(even) td { background: #fef3e2; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
      </style></head><body>
      <h1>📊 Resumos Semanais de Marketing</h1>
      <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} · ${summaries.length} semana(s)</p>
      <table>
        <thead><tr>
          <th>Período</th><th>Campanhas</th><th>Destinatários</th><th>Abertura</th>
          <th>E-mails</th><th>Falhas</th><th>Automações</th><th>Newsletter</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">Supet · Relatório automático de marketing</p>
      </body></html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up bloqueado. Permita pop-ups e tente novamente.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success("PDF pronto para impressão!");
  };

  return (
    <div className="bg-card rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileBarChart className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Resumos Semanais</p>
        {summaries.length > 0 && (
          <button
            onClick={exportPDF}
            className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            title="Exportar PDF"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        )}
        <span className={`text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ${summaries.length > 0 ? "" : "ml-auto"}`}>
          {summaries.length} semana{summaries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhum resumo gerado ainda. O primeiro será criado automaticamente na próxima segunda-feira.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {summaries.map((s, i) => {
            const isOpen = expanded === s.id;
            const d = s.summary;
            return (
              <div key={s.id} className="border border-border/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">
                        {formatDate(s.week_start)} — {formatDate(s.week_end)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.campaigns_sent} camp. · {d.emails_sent} emails · {d.automation_executions} exec.
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: "Campanhas enviadas", value: d.campaigns_sent, icon: Megaphone, color: "text-primary" },
                          { label: "Destinatários", value: d.recipients_reached, icon: Users, color: "text-blue-600" },
                          { label: "Taxa abertura", value: `${d.open_rate}%`, icon: Eye, color: "text-violet-600" },
                          { label: "Automações exec.", value: d.automation_executions, icon: Zap, color: "text-amber-600" },
                          { label: "E-mails enviados", value: d.emails_sent, icon: Mail, color: "text-emerald-600" },
                          { label: "E-mails falhados", value: d.emails_failed, icon: Mail, color: d.emails_failed > 0 ? "text-destructive" : "text-muted-foreground" },
                          { label: "Novos assinantes", value: `+${d.new_subscribers}`, icon: Users, color: "text-emerald-600" },
                          { label: "Cancelamentos", value: d.unsubscribes, icon: Users, color: d.unsubscribes > 0 ? "text-destructive" : "text-muted-foreground" },
                        ].map((m) => (
                          <div key={m.label} className="flex items-center gap-2">
                            <m.icon className={`w-3.5 h-3.5 flex-shrink-0 ${m.color}`} />
                            <div>
                              <p className="text-sm font-extrabold text-foreground">{m.value}</p>
                              <p className="text-[9px] text-muted-foreground">{m.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
