import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Megaphone, Zap, Mail, Users,
  Eye, ChevronDown, ChevronUp, Loader2, FileBarChart, Download,
} from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="bg-card rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileBarChart className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Resumos Semanais</p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
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
