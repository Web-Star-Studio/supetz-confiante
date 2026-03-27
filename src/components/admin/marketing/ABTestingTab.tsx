import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Plus, Trophy, Users, Eye, Percent,
  Loader2, Send, Trash2, CheckCircle, Clock, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Progress } from "@/components/ui/progress";

interface ABTest {
  key: string;
  name: string;
  status: "running" | "completed";
  created_at: string;
  completed_at?: string;
  winner?: "A" | "B";
  variants: {
    A: { name: string; message: string; campaign_id?: string; recipients: number; opened: number; couponsUsed: number; couponsTotal: number };
    B: { name: string; message: string; campaign_id?: string; recipients: number; opened: number; couponsUsed: number; couponsTotal: number };
  };
}

interface ABTestStore {
  tests: ABTest[];
}

export default function ABTestingTab() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { log } = useAuditLog();

  const [form, setForm] = useState({
    name: "",
    variantAName: "Variante A",
    variantAMessage: "",
    variantBName: "Variante B",
    variantBMessage: "",
  });
  const [sending, setSending] = useState(false);

  async function fetchTests() {
    setLoading(true);
    const { data } = await supabase.from("store_settings").select("value").eq("key", "ab_tests").single();
    const store = data?.value as unknown as ABTestStore;
    let testsList = store?.tests || [];

    // Refresh metrics for running tests
    if (testsList.some(t => t.status === "running")) {
      const campIds = testsList.flatMap(t => [t.variants.A.campaign_id, t.variants.B.campaign_id].filter(Boolean)) as string[];
      if (campIds.length > 0) {
        const { data: recs } = await supabase.from("campaign_recipients").select("campaign_id, opened, coupon_id").in("campaign_id", campIds);
        const recipients = recs || [];
        const couponIds = recipients.map((r: any) => r.coupon_id).filter(Boolean);
        let usedSet = new Set<string>();
        if (couponIds.length > 0) {
          const { data: used } = await supabase.from("user_coupons").select("id").eq("used", true).in("id", couponIds);
          usedSet = new Set((used || []).map((c: any) => c.id));
        }

        testsList = testsList.map(t => {
          if (t.status !== "running") return t;
          for (const v of ["A", "B"] as const) {
            const cid = t.variants[v].campaign_id;
            if (cid) {
              const vRecs = recipients.filter((r: any) => r.campaign_id === cid);
              t.variants[v].recipients = vRecs.length;
              t.variants[v].opened = vRecs.filter((r: any) => r.opened).length;
              const withCoupon = vRecs.filter((r: any) => r.coupon_id);
              t.variants[v].couponsTotal = withCoupon.length;
              t.variants[v].couponsUsed = withCoupon.filter((r: any) => usedSet.has(r.coupon_id)).length;
            }
          }
          return t;
        });
      }
    }

    setTests(testsList);
    setLoading(false);
  }

  useEffect(() => { fetchTests(); }, []);

  async function saveTests(updated: ABTest[]) {
    await supabase.from("store_settings").upsert({
      key: "ab_tests",
      value: { tests: updated } as any,
    });
    setTests(updated);
  }

  async function createTest() {
    if (!form.name.trim() || !form.variantAMessage.trim() || !form.variantBMessage.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSending(true);

    // Get all eligible users and split 50/50
    const { data: profiles } = await supabase.from("profiles").select("user_id");
    const allUsers = (profiles || []).map((p: any) => p.user_id);
    const shuffled = allUsers.sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const groupA = shuffled.slice(0, half);
    const groupB = shuffled.slice(half);

    if (groupA.length === 0) {
      toast.error("Nenhum usuário disponível");
      setSending(false);
      return;
    }

    // Create two campaigns
    const [campARes, campBRes] = await Promise.all([
      supabase.from("campaigns").insert({
        name: `${form.name} — ${form.variantAName}`,
        type: "notification",
        message: form.variantAMessage,
        status: "active",
        sent_at: new Date().toISOString(),
        recipients_count: groupA.length,
      } as any).select().single(),
      supabase.from("campaigns").insert({
        name: `${form.name} — ${form.variantBName}`,
        type: "notification",
        message: form.variantBMessage,
        status: "active",
        sent_at: new Date().toISOString(),
        recipients_count: groupB.length,
      } as any).select().single(),
    ]);

    const campA = campARes.data as any;
    const campB = campBRes.data as any;

    if (!campA || !campB) {
      toast.error("Erro ao criar campanhas");
      setSending(false);
      return;
    }

    // Send notifications and create recipients
    const insertBatch = async (userIds: string[], campId: string, message: string, name: string) => {
      for (const uid of userIds) {
        await supabase.from("user_notifications").insert({
          user_id: uid, title: `📢 ${name}`, message, type: "campaign", link: "/shop",
        });
        await supabase.from("campaign_recipients").insert({
          campaign_id: campId, user_id: uid,
        });
      }
    };

    await Promise.all([
      insertBatch(groupA, campA.id, form.variantAMessage, form.variantAName),
      insertBatch(groupB, campB.id, form.variantBMessage, form.variantBName),
    ]);

    const newTest: ABTest = {
      key: Date.now().toString(),
      name: form.name,
      status: "running",
      created_at: new Date().toISOString(),
      variants: {
        A: { name: form.variantAName, message: form.variantAMessage, campaign_id: campA.id, recipients: groupA.length, opened: 0, couponsUsed: 0, couponsTotal: 0 },
        B: { name: form.variantBName, message: form.variantBMessage, campaign_id: campB.id, recipients: groupB.length, opened: 0, couponsUsed: 0, couponsTotal: 0 },
      },
    };

    await saveTests([newTest, ...tests]);
    log({ action: "create", entity_type: "ab_test", entity_id: newTest.key, details: { name: form.name } });
    toast.success(`Teste A/B criado! ${groupA.length} + ${groupB.length} destinatários`);
    setForm({ name: "", variantAName: "Variante A", variantAMessage: "", variantBName: "Variante B", variantBMessage: "" });
    setShowCreate(false);
    setSending(false);
  }

  async function declareWinner(testKey: string) {
    const updated = tests.map(t => {
      if (t.key !== testKey) return t;
      const rateA = t.variants.A.recipients > 0 ? t.variants.A.opened / t.variants.A.recipients : 0;
      const rateB = t.variants.B.recipients > 0 ? t.variants.B.opened / t.variants.B.recipients : 0;
      return { ...t, status: "completed" as const, completed_at: new Date().toISOString(), winner: rateA >= rateB ? "A" as const : "B" as const };
    });
    await saveTests(updated);
    toast.success("Teste finalizado! Vencedor declarado.");
  }

  async function deleteTest(testKey: string) {
    const updated = tests.filter(t => t.key !== testKey);
    await saveTests(updated);
    toast.success("Teste removido");
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">Testes A/B</h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo Teste
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-foreground">Criar Teste A/B</h4>
              <p className="text-xs text-muted-foreground">Os usuários serão divididos aleatoriamente em dois grupos iguais. Cada grupo receberá uma variante diferente da mensagem.</p>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome do teste</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Teste mensagem Black Friday" className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["A", "B"] as const).map((v) => (
                  <div key={v} className={`rounded-2xl border-2 p-4 space-y-3 ${v === "A" ? "border-primary/30" : "border-violet-500/30"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${v === "A" ? "bg-primary/15 text-primary" : "bg-violet-500/15 text-violet-600"}`}>{v}</span>
                      <input
                        value={v === "A" ? form.variantAName : form.variantBName}
                        onChange={(e) => setForm({ ...form, [v === "A" ? "variantAName" : "variantBName"]: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <textarea
                      value={v === "A" ? form.variantAMessage : form.variantBMessage}
                      onChange={(e) => setForm({ ...form, [v === "A" ? "variantAMessage" : "variantBMessage"]: e.target.value })}
                      placeholder={`Mensagem da variante ${v}...`}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                <button onClick={createTest} disabled={sending || !form.name.trim() || !form.variantAMessage.trim() || !form.variantBMessage.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                  <Send className="w-4 h-4" /> {sending ? "Criando..." : "Criar e Enviar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tests list */}
      {tests.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">
          Nenhum teste A/B criado ainda. Crie um para comparar variantes de campanha.
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const rateA = test.variants.A.recipients > 0 ? (test.variants.A.opened / test.variants.A.recipients) * 100 : 0;
            const rateB = test.variants.B.recipients > 0 ? (test.variants.B.opened / test.variants.B.recipients) * 100 : 0;
            const totalA = test.variants.A.recipients;
            const totalB = test.variants.B.recipients;
            const isRunning = test.status === "running";
            const confidence = totalA + totalB > 20 ? Math.min(99, 50 + Math.abs(rateA - rateB) * 2) : Math.min(60, 30 + totalA + totalB);

            return (
              <div key={test.key} className="bg-card rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlaskConical className={`w-5 h-5 ${isRunning ? "text-primary" : "text-emerald-600"}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{test.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isRunning ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-600"}`}>
                          {isRunning ? "Em andamento" : "Concluído"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(test.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRunning && (
                      <button onClick={() => declareWinner(test.key)} className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 font-semibold hover:bg-emerald-500/25">
                        <Trophy className="w-3 h-3 inline mr-1" />Finalizar
                      </button>
                    )}
                    <button onClick={() => deleteTest(test.key)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Variant comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["A", "B"] as const).map((v) => {
                    const variant = test.variants[v];
                    const rate = v === "A" ? rateA : rateB;
                    const isWinner = test.winner === v;
                    const borderColor = isWinner ? "border-amber-400" : v === "A" ? "border-primary/20" : "border-violet-500/20";
                    return (
                      <div key={v} className={`rounded-2xl border-2 p-4 relative ${borderColor} ${isWinner ? "bg-amber-500/5" : ""}`}>
                        {isWinner && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center">
                            <Trophy className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${v === "A" ? "bg-primary/15 text-primary" : "bg-violet-500/15 text-violet-600"}`}>{v}</span>
                          <p className="text-sm font-bold text-foreground">{variant.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{variant.message}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-foreground">{variant.recipients}</p>
                            <p className="text-[10px] text-muted-foreground">Enviados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-foreground">{variant.opened}</p>
                            <p className="text-[10px] text-muted-foreground">Aberturas</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-lg font-extrabold ${rate > 50 ? "text-emerald-600" : "text-foreground"}`}>{rate.toFixed(1)}%</p>
                            <p className="text-[10px] text-muted-foreground">Taxa</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={rate} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confidence indicator */}
                <div className="bg-muted rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Confiança estatística</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={confidence} className="h-2 w-24" />
                    <span className={`text-xs font-bold ${confidence >= 90 ? "text-emerald-600" : confidence >= 70 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {confidence.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Lift */}
                {rateA !== rateB && (totalA + totalB > 0) && (
                  <p className="text-xs text-muted-foreground text-center">
                    {rateA > rateB
                      ? `Variante A tem ${((rateA - rateB)).toFixed(1)}pp a mais que B`
                      : `Variante B tem ${((rateB - rateA)).toFixed(1)}pp a mais que A`
                    }
                    {" "}— Lift de {Math.min(rateA, rateB) > 0 ? ((Math.abs(rateA - rateB) / Math.min(rateA, rateB)) * 100).toFixed(0) : "∞"}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
