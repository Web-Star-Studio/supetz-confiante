import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Sparkles, Send, Loader2, BookOpen, ChefHat,
  Activity, Brain, PawPrint, RefreshCw, Lightbulb, HeartPulse, Calendar, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import supetIaAvatar from "@/assets/supet-ia-avatar.png";

type Msg = { role: "user" | "assistant"; content: string; isEmergency?: boolean };
type AIMode = "assistant" | "tips" | "analysis" | "recipes" | "fun_facts" | "health_plan";

interface PetInfo {
  id: string;
  name: string;
  breed: string | null;
  weight_kg: number | null;
  birth_date: string | null;
  photo_url: string | null;
}

interface Tip { emoji: string; title: string; description: string }
interface Recipe { name: string; emoji: string; ingredients: string[]; instructions: string; warning?: string }
interface FunFact { emoji: string; fact: string }
interface DayPlan {
  day: string;
  activities: { category: string; emoji: string; title: string; description: string; duration?: string }[];
}

const modeConfig: Record<AIMode, { icon: typeof MessageCircle; label: string; color: string }> = {
  assistant: { icon: MessageCircle, label: "Assistente", color: "bg-primary" },
  tips: { icon: Lightbulb, label: "Dicas", color: "bg-amber-500" },
  analysis: { icon: Activity, label: "Análise", color: "bg-emerald-500" },
  recipes: { icon: ChefHat, label: "Receitas", color: "bg-rose-500" },
  fun_facts: { icon: Brain, label: "Curiosidades", color: "bg-violet-500" },
  health_plan: { icon: HeartPulse, label: "Plano Semanal", color: "bg-sky-500" },
};

const categoryColors: Record<string, string> = {
  exercicio: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  higiene: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  alimentacao: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  socializacao: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  mental: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  descanso: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function AIPetAssistantTab() {
  const { user } = useAuth();
  const [mode, setMode] = useState<AIMode>("assistant");
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [pet, setPet] = useState<PetInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [funFacts, setFunFacts] = useState<FunFact[]>([]);
  const [analysisText, setAnalysisText] = useState("");
  const [healthPlan, setHealthPlan] = useState<DayPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadPets();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadPets = async () => {
    setPetsLoading(true);
    const { data } = await supabase.from("pets").select("id, name, breed, weight_kg, birth_date, photo_url").eq("user_id", user!.id).order("created_at", { ascending: true });
    const petList = (data as PetInfo[]) || [];
    setPets(petList);
    if (petList.length > 0 && !pet) setPet(petList[0]);
    setPetsLoading(false);
  };

  const selectPet = (p: PetInfo) => {
    setPet(p);
    // Reset all AI content when switching pets
    setMessages([]);
    setTips([]);
    setRecipes([]);
    setFunFacts([]);
    setAnalysisText("");
    setHealthPlan([]);
    setSelectedDay(0);
    setMode("assistant");
  };

  const callAI = async (aiMode: AIMode, userMessages?: Msg[]) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pet-ai`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ mode: aiMode, messages: userMessages, petInfo: pet }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Erro de rede" }));
      throw new Error(err.error || "Erro ao conectar com IA");
    }
    // Check for emergency JSON response
    const contentType = resp.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (data.isEmergency) {
        return { isEmergency: true, content: data.content, resp: null };
      }
      return { isEmergency: false, content: data.content, resp: null };
    }
    return { isEmergency: false, content: null, resp };
  };

  // Streaming chat
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    let assistantText = "";
    const upsert = (chunk: string) => {
      assistantText += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        return [...prev, { role: "assistant", content: assistantText }];
      });
    };

    try {
      const result = await callAI("assistant", newMessages);
      if (result.isEmergency) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.content, isEmergency: true }]);
        setLoading(false);
        return;
      }
      const reader = result.resp!.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  // Non-streaming modes
  const fetchContent = async (aiMode: AIMode) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await callAI(aiMode);

      if (result.isEmergency) {
        // Emergency responses shouldn't happen for non-assistant modes, but handle gracefully
        toast.error(result.content);
        setLoading(false);
        return;
      }

      if (aiMode === "analysis") {
        const reader = result.resp!.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let text = "";
        setAnalysisText("");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) { text += c; setAnalysisText(text); }
            } catch { /* partial */ }
          }
        }
      } else {
        const content = result.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (aiMode === "tips" && parsed.tips) setTips(parsed.tips);
          if (aiMode === "recipes" && parsed.recipes) setRecipes(parsed.recipes);
          if (aiMode === "fun_facts" && parsed.facts) setFunFacts(parsed.facts);
          if (aiMode === "health_plan" && parsed.plan) { setHealthPlan(parsed.plan); setSelectedDay(0); }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    if (newMode !== "assistant" && newMode !== "analysis") {
      if (newMode === "tips" && tips.length === 0) fetchContent("tips");
      if (newMode === "recipes" && recipes.length === 0) fetchContent("recipes");
      if (newMode === "fun_facts" && funFacts.length === 0) fetchContent("fun_facts");
      if (newMode === "health_plan" && healthPlan.length === 0) fetchContent("health_plan");
    }
    if (newMode === "analysis" && !analysisText) {
      fetchAnalysis();
    }
  };

  const fetchAnalysis = async () => {
    if (!user) return;
    const { data: logs } = await supabase.from("treatment_logs").select("log_date, notes").eq("user_id", user.id).order("log_date", { ascending: false }).limit(20);
    const logsText = logs?.length
      ? logs.map((l) => `${l.log_date}: ${l.notes || "Sem notas"}`).join("\n")
      : "Nenhum registro de tratamento encontrado.";

    setLoading(true);
    setAnalysisText("");
    try {
      const result = await callAI("analysis", [{ role: "user", content: `Registros de tratamento:\n${logsText}\n\nAnalise a evolução do tratamento e dê insights.` }]);
      if (result.isEmergency) { setLoading(false); return; }
      const reader = result.resp!.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { text += c; setAnalysisText(text); }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  if (!pet) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-supet-bg-alt p-8 text-center space-y-4">
        <PawPrint className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">Cadastre seu pet primeiro!</h3>
        <p className="text-sm text-muted-foreground">Para usar o assistente com IA, você precisa ter um pet cadastrado.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(Object.keys(modeConfig) as AIMode[]).map((key) => {
          const { icon: Icon, label, color } = modeConfig[key];
          const active = mode === key;
          return (
            <button key={key} onClick={() => handleModeChange(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
                active ? `${color} text-white shadow-md` : "bg-supet-bg-alt text-muted-foreground hover:bg-primary/10"
              }`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* Chat mode */}
      {mode === "assistant" && (
        <div className="rounded-3xl bg-supet-bg-alt overflow-hidden flex flex-col" style={{ height: "480px" }}>
          <div className="bg-primary px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-foreground/20">
              <img src={supetIaAvatar} alt="Super Pet AI" className="h-full w-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-foreground">Super Pet AI</h3>
              <p className="text-xs text-primary-foreground/70">Assistente virtual para {pet.name}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="h-14 w-14 mx-auto rounded-full overflow-hidden border-2 border-primary/20">
                  <img src={supetIaAvatar} alt="Super Pet AI" className="h-full w-full object-cover" />
                </div>
                <p className="text-sm text-muted-foreground">Olá! Sou a Super Pet AI 🐾<br />Posso dar orientações gerais sobre cuidados com {pet.name}!</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">⚠️ Não substituo consultas veterinárias.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[`${pet.name} pode comer banana?`, `Dicas de exercício para ${pet.breed || "meu cachorro"}`, "Sinais de que meu pet está doente"].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : m.isEmergency
                      ? "bg-destructive/10 border-2 border-destructive/30 text-foreground rounded-bl-md"
                      : "bg-supet-bg text-foreground rounded-bl-md"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>ul]:mb-2">
                      {m.isEmergency && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span className="text-xs font-bold text-destructive uppercase">Emergência</span>
                        </div>
                      )}
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-supet-bg rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border space-y-2">
            <p className="text-[10px] text-muted-foreground/70 text-center">⚠️ Informações geradas por IA. Consulte sempre um veterinário profissional.</p>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Pergunte algo sobre ${pet.name}...`}
                className="flex-1 rounded-full bg-supet-bg px-4 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
              <button type="submit" disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tips */}
      {mode === "tips" && (
        <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" /> Dicas para {pet.name}
            </h3>
            <button onClick={() => { setTips([]); fetchContent("tips"); }} disabled={loading}
              className="text-sm text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Novas dicas
            </button>
          </div>
          {loading && tips.length === 0 ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {tips.map((tip, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-3 p-4 rounded-2xl bg-supet-bg">
                    <span className="text-2xl">{tip.emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{tip.description}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Analysis */}
      {mode === "analysis" && (
        <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" /> Análise de Tratamento
            </h3>
            <button onClick={fetchAnalysis} disabled={loading}
              className="text-sm text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reanalisar
            </button>
          </div>
          {loading && !analysisText ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : analysisText ? (
            <div className="prose prose-sm max-w-none dark:prose-invert bg-supet-bg p-5 rounded-2xl">
              <ReactMarkdown>{analysisText}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando análise...</p>
          )}
        </div>
      )}

      {/* Recipes */}
      {mode === "recipes" && (
        <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-rose-500" /> Receitas para {pet.name}
            </h3>
            <button onClick={() => { setRecipes([]); fetchContent("recipes"); }} disabled={loading}
              className="text-sm text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Novas receitas
            </button>
          </div>
          {loading && recipes.length === 0 ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {recipes.map((recipe, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                    className="p-5 rounded-2xl bg-supet-bg space-y-3">
                    <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span className="text-xl">{recipe.emoji}</span> {recipe.name}
                    </h4>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ingredientes</p>
                      <ul className="text-sm text-foreground space-y-0.5">
                        {recipe.ingredients.map((ing, j) => <li key={j} className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" />{ing}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Modo de Preparo</p>
                      <p className="text-sm text-foreground">{recipe.instructions}</p>
                    </div>
                    {recipe.warning && (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl">⚠️ {recipe.warning}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Fun Facts */}
      {mode === "fun_facts" && (
        <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" /> Curiosidades{pet.breed ? ` sobre ${pet.breed}` : ""}
            </h3>
            <button onClick={() => { setFunFacts([]); fetchContent("fun_facts"); }} disabled={loading}
              className="text-sm text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Mais curiosidades
            </button>
          </div>
          {loading && funFacts.length === 0 ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {funFacts.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-supet-bg">
                    <span className="text-2xl">{f.emoji}</span>
                    <p className="text-sm text-foreground mt-2">{f.fact}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Health Plan */}
      {mode === "health_plan" && (
        <div className="rounded-3xl bg-supet-bg-alt p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-sky-500" /> Plano Semanal para {pet.name}
            </h3>
            <button onClick={() => { setHealthPlan([]); fetchContent("health_plan"); }} disabled={loading}
              className="text-sm text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Novo plano
            </button>
          </div>

          {loading && healthPlan.length === 0 ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : healthPlan.length > 0 ? (
            <>
              {/* Day selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {healthPlan.map((day, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedDay === i ? "bg-sky-500 text-white shadow-md" : "bg-supet-bg text-muted-foreground hover:bg-sky-100 dark:hover:bg-sky-900/20"
                    }`}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {day.day}
                  </button>
                ))}
              </div>

              {/* Activities for selected day */}
              <AnimatePresence mode="wait">
                <motion.div key={selectedDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                  {healthPlan[selectedDay]?.activities.map((act, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex gap-3 p-4 rounded-2xl bg-supet-bg">
                      <span className="text-2xl">{act.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-foreground">{act.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[act.category] || "bg-muted text-muted-foreground"}`}>
                            {act.category}
                          </span>
                          {act.duration && (
                            <span className="text-[10px] text-muted-foreground">⏱ {act.duration}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{act.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Gerando plano semanal...</p>
          )}
        </div>
      )}

      {/* Global disclaimer */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-4 py-3 text-center">
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          ⚠️ As informações fornecidas pela Super Pet AI são orientações gerais geradas por inteligência artificial e <strong>não substituem</strong> a consulta com um veterinário profissional. Nunca tome decisões sobre a saúde do seu pet com base exclusivamente nestas orientações.
        </p>
      </div>
    </motion.div>
  );
}
