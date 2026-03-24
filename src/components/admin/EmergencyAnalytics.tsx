import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingUp, MessageCircle, Clock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

type Period = "7d" | "30d" | "90d";

const periodLabels: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
};

interface EmergencyLog {
  id: string;
  user_id: string | null;
  message_content: string;
  matched_keyword: string | null;
  source: string;
  created_at: string;
}

export default function EmergencyAnalytics() {
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const cutoff = subMonths(new Date(), 3).toISOString();
    const { data } = await supabase
      .from("emergency_logs")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });
    setLogs((data as EmergencyLog[]) || []);
    setLoading(false);
  };

  const periodDays = { "7d": 7, "30d": 30, "90d": 90 };

  const filteredLogs = useMemo(() => {
    const cutoff = subDays(new Date(), periodDays[period]);
    return logs.filter((l) => new Date(l.created_at) >= cutoff);
  }, [logs, period]);

  const dailyData = useMemo(() => {
    const days = periodDays[period];
    const result: { day: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayStr = d.toDateString();
      const label = format(d, days <= 14 ? "dd/MM" : "dd/MM", { locale: ptBR });
      const count = filteredLogs.filter((l) => new Date(l.created_at).toDateString() === dayStr).length;
      result.push({ day: label, count });
    }
    // For longer periods, group by week
    if (days > 14) {
      const weekly: { day: string; count: number }[] = [];
      for (let i = 0; i < result.length; i += 7) {
        const chunk = result.slice(i, i + 7);
        weekly.push({
          day: chunk[0].day,
          count: chunk.reduce((s, c) => s + c.count, 0),
        });
      }
      return weekly;
    }
    return result;
  }, [filteredLogs, period]);

  const keywordData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      const kw = l.matched_keyword || "Outro";
      counts[kw] = (counts[kw] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredLogs]);

  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      const src = l.source === "pet-ai" ? "SuperPet AI" : "Chatbot";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const PIE_COLORS = ["hsl(27, 100%, 49%)", "hsl(25, 60%, 65%)"];

  if (loading) {
    return (
      <div className="rounded-3xl bg-muted/50 p-6 animate-pulse">
        <div className="h-5 w-48 bg-border rounded-full mb-4" />
        <div className="h-48 bg-border rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-destructive/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-display">Emergências Detectadas</h2>
            <p className="text-xs text-muted-foreground">Mensagens interceptadas pelo filtro de segurança</p>
          </div>
        </div>
        <div className="flex rounded-full bg-muted p-0.5 border border-border/50">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-muted/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Total</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Média/dia</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {periodDays[period] > 0 ? (filteredLogs.length / periodDays[period]).toFixed(1) : "0"}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Keywords</span>
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{keywordData.length}</p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Última</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">
            {filteredLogs[0] ? format(new Date(filteredLogs[0].created_at), "dd/MM HH:mm") : "—"}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 rounded-3xl bg-muted/50 p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Emergências ao longo do tempo</h3>
          {filteredLogs.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="emergGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12 }}
                    formatter={(value: number) => [value, "Emergências"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="url(#emergGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma emergência no período
            </div>
          )}
        </div>

        {/* Source pie */}
        <div className="rounded-3xl bg-muted/50 p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Por origem</h3>
          {sourceData.length > 0 ? (
            <div className="h-52 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={2}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {sourceData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground font-medium">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Top keywords */}
      <div className="rounded-3xl bg-muted/50 p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Palavras-chave mais detectadas</h3>
        {keywordData.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="keyword" type="category" tick={{ fontSize: 11, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12 }}
                  formatter={(value: number) => [value, "Ocorrências"]}
                />
                <Bar dataKey="count" fill="hsl(27, 100%, 49%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma emergência detectada no período
          </div>
        )}
      </div>

      {/* Recent logs */}
      {filteredLogs.length > 0 && (
        <div className="rounded-3xl bg-muted/50 overflow-hidden">
          <div className="p-5">
            <h3 className="text-sm font-bold text-foreground">Últimas mensagens de emergência</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/60">
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground">Origem</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground">Keyword</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 10).map((log, i) => (
                  <tr key={log.id} className={`transition-colors hover:bg-primary/5 ${i % 2 === 1 ? "bg-background/30" : ""}`}>
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        log.source === "pet-ai" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                      }`}>
                        {log.source === "pet-ai" ? "SuperPet AI" : "Chatbot"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-foreground">{log.matched_keyword || "—"}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.message_content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
