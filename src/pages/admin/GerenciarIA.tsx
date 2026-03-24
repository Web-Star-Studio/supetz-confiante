import { useState, useEffect, useCallback } from "react";
import {
  Brain, Save, RefreshCw, Shield, Zap, BarChart3, AlertTriangle,
  Settings2, Plus, X, Thermometer, MessageSquare, Bot, Users,
  Clock, Send, Loader2, TestTube, Sparkles, Eye,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

/* ─── Types ─── */
interface AIConfig {
  model: string;
  temperature: number;
  chatbot_system_prompt: string;
  pet_ai_persona: string;
  emergency_keywords_extra: string[];
  emergency_response_custom: string;
  safety_rules_extra: string;
  max_context_messages: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: AIConfig = {
  model: "google/gemini-3-flash-preview",
  temperature: 0.4,
  chatbot_system_prompt: "",
  pet_ai_persona: "",
  emergency_keywords_extra: [],
  emergency_response_custom: "",
  safety_rules_extra: "",
  max_context_messages: 20,
  enabled: true,
};

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Equilibrado — veloz e eficiente", tier: "fast" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Multimodal, bom custo-benefício", tier: "fast" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Mais barato, simples", tier: "economy" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Mais preciso, mais caro", tier: "pro" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Última geração, raciocínio avançado", tier: "pro" },
  { id: "openai/gpt-5", label: "GPT-5", desc: "Excelente raciocínio, mais caro", tier: "pro" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Bom equilíbrio custo/qualidade", tier: "fast" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", desc: "Rápido e econômico", tier: "economy" },
  { id: "openai/gpt-5.2", label: "GPT-5.2", desc: "Mais recente da OpenAI", tier: "pro" },
];

const TIER_COLORS: Record<string, string> = {
  economy: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  fast: "bg-blue-500/10 text-blue-600 border-blue-200",
  pro: "bg-violet-500/10 text-violet-600 border-violet-200",
};
const TIER_LABELS: Record<string, string> = { economy: "Econômico", fast: "Rápido", pro: "Premium" };

/* ─── Main Page ─── */
export default function GerenciarIA() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  // Metrics
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [activeCredits, setActiveCredits] = useState(0);
  const [recentEmergencies, setRecentEmergencies] = useState<any[]>([]);
  const [dailyUsage, setDailyUsage] = useState<any[]>([]);

  // Playground
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadMetrics();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "ai_config")
      .maybeSingle();

    if (data?.value) {
      const merged = { ...DEFAULT_CONFIG, ...(data.value as any) };
      setConfig(merged);
      setOriginalConfig(merged);
    }
    setLoading(false);
  };

  const loadMetrics = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [emergRes, chatRes, creditsRes, recentEmRes, chatDailyRes] = await Promise.all([
      supabase.from("emergency_logs").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabase.from("ai_access_credits").select("id", { count: "exact", head: true }).gte("expires_at", now.toISOString()),
      supabase.from("emergency_logs").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("chat_messages").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
    ]);

    setEmergencyCount(emergRes.count || 0);
    setChatCount(chatRes.count || 0);
    setActiveCredits(creditsRes.count || 0);
    setRecentEmergencies(recentEmRes.data || []);

    // Build daily usage chart data
    const dailyMap: Record<string, number> = {};
    const msgs = chatDailyRes.data || [];
    msgs.forEach((m: any) => {
      const day = m.created_at.slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    // Fill in missing days
    const days: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        mensagens: dailyMap[key] || 0,
      });
    }
    setDailyUsage(days);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ key: "ai_config", value: config as any, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações da IA salvas!");
      setOriginalConfig(config);
    }
    setSaving(false);
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || config.emergency_keywords_extra.includes(kw)) return;
    setConfig(c => ({ ...c, emergency_keywords_extra: [...c.emergency_keywords_extra, kw] }));
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    setConfig(c => ({ ...c, emergency_keywords_extra: c.emergency_keywords_extra.filter(k => k !== kw) }));
  };

  const testAI = useCallback(async () => {
    if (!testPrompt.trim()) return;
    setTestLoading(true);
    setTestResponse("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("chatbot", {
        body: {
          messages: [{ role: "user", content: testPrompt }],
          conversationId: `test-${Date.now()}`,
        },
      });

      if (res.error) {
        setTestResponse(`Erro: ${res.error.message}`);
      } else if (res.data?.content) {
        setTestResponse(res.data.content);
      } else if (res.data) {
        // Streaming response — read body
        const reader = (res.data as ReadableStream).getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              full += delta;
              setTestResponse(full);
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setTestResponse(`Erro: ${e.message}`);
    }
    setTestLoading(false);
  }, [testPrompt]);

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === config.model);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Brain className="w-5 h-5" />
              </div>
              Gerenciar IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-[52px]">
              Controle modelos, prompts, segurança e métricas da Super Pet AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
              <span className="text-xs font-semibold text-muted-foreground">IA</span>
              <Switch checked={config.enabled} onCheckedChange={(v) => setConfig(c => ({ ...c, enabled: v }))} />
              <span className={`text-xs font-bold ${config.enabled ? "text-emerald-600" : "text-destructive"}`}>
                {config.enabled ? "Ativa" : "Inativa"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => { loadConfig(); loadMetrics(); }} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Recarregar
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={!hasChanges || saving}>
              <Save className="w-4 h-4 mr-1.5" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Mensagens (30d)", value: chatCount, icon: <MessageSquare className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600" },
            { label: "Emergências (30d)", value: emergencyCount, icon: <AlertTriangle className="w-4 h-4" />, color: "bg-red-500/10 text-red-600" },
            { label: "Créditos ativos", value: activeCredits, icon: <Zap className="w-4 h-4" />, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Modelo", value: selectedModel?.label || "—", icon: <Bot className="w-4 h-4" />, color: "bg-primary/10 text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="modelo" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="modelo" className="text-xs gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Modelo</TabsTrigger>
            <TabsTrigger value="prompts" className="text-xs gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Prompts</TabsTrigger>
            <TabsTrigger value="seguranca" className="text-xs gap-1.5"><Shield className="w-3.5 h-3.5" /> Segurança</TabsTrigger>
            <TabsTrigger value="playground" className="text-xs gap-1.5"><TestTube className="w-3.5 h-3.5" /> Playground</TabsTrigger>
            <TabsTrigger value="metricas" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Métricas</TabsTrigger>
          </TabsList>

          {/* ─── Modelo & Parâmetros ─── */}
          <TabsContent value="modelo">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" /> Modelo de IA
                </h3>
                <div className="space-y-2">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setConfig(c => ({ ...c, model: model.id }))}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        config.model === model.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-foreground">{model.label}</span>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TIER_COLORS[model.tier]}`}>
                            {TIER_LABELS[model.tier]}
                          </Badge>
                        </div>
                        {config.model === model.id && (
                          <Badge variant="default" className="text-[10px] shrink-0">Ativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{model.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-500" /> Temperatura
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Valores baixos = mais preciso. Valores altos = mais criativo.
                  </p>
                  <div className="space-y-3">
                    <Slider
                      value={[config.temperature]}
                      onValueChange={([v]) => setConfig(c => ({ ...c, temperature: v }))}
                      min={0} max={1} step={0.05}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Preciso (0.0)</span>
                      <span className="font-bold text-foreground text-base">{config.temperature.toFixed(2)}</span>
                      <span>Criativo (1.0)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" /> Janela de Contexto
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Máximo de mensagens no contexto
                    </label>
                    <Input
                      type="number"
                      value={config.max_context_messages}
                      onChange={(e) => setConfig(c => ({ ...c, max_context_messages: parseInt(e.target.value) || 20 }))}
                      min={5} max={50}
                      className="w-28"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Mais mensagens = mais contexto, porém mais tokens consumidos
                    </p>
                  </div>
                </div>

                {/* Current config summary */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Configuração Atual
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Modelo:</span> <span className="font-semibold text-foreground">{selectedModel?.label}</span></div>
                    <div><span className="text-muted-foreground">Temp:</span> <span className="font-semibold text-foreground">{config.temperature.toFixed(2)}</span></div>
                    <div><span className="text-muted-foreground">Contexto:</span> <span className="font-semibold text-foreground">{config.max_context_messages} msgs</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <span className={`font-semibold ${config.enabled ? "text-emerald-600" : "text-destructive"}`}>{config.enabled ? "Ativa" : "Inativa"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Prompts & Persona ─── */}
          <TabsContent value="prompts">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" /> Prompt do Chatbot (Loja)
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {config.chatbot_system_prompt.length} caracteres
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instruções adicionais para o chatbot geral da loja. Será adicionado ao final do prompt padrão.
                </p>
                <Textarea
                  value={config.chatbot_system_prompt}
                  onChange={(e) => setConfig(c => ({ ...c, chatbot_system_prompt: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="Ex: Sempre mencionar a promoção atual de frete grátis para pedidos acima de R$150..."
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-500" /> Persona da Super Pet AI
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {config.pet_ai_persona.length} caracteres
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instruções adicionais para a IA do perfil do pet (assistente, dicas, receitas, etc.). Adicionado ao início do prompt de cada modo.
                </p>
                <Textarea
                  value={config.pet_ai_persona}
                  onChange={(e) => setConfig(c => ({ ...c, pet_ai_persona: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="Ex: Sempre ser muito carinhosa e usar o nome do pet nas respostas..."
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" /> Regras de Segurança Extras
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {config.safety_rules_extra.length} caracteres
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Regras adicionais somadas às regras de segurança padrão.
                </p>
                <Textarea
                  value={config.safety_rules_extra}
                  onChange={(e) => setConfig(c => ({ ...c, safety_rules_extra: e.target.value }))}
                  rows={4}
                  className="font-mono text-xs"
                  placeholder="Ex: Nunca recomendar produtos de concorrentes..."
                />
              </div>
            </div>
          </TabsContent>

          {/* ─── Segurança & Emergências ─── */}
          <TabsContent value="seguranca">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Palavras-Chave de Emergência (Extras)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    O sistema possui ~90 palavras-chave padrão. Adicione termos extras aqui.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Nova palavra-chave..."
                      className="flex-1"
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    />
                    <Button size="sm" onClick={addKeyword} disabled={!newKeyword.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {config.emergency_keywords_extra.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700 gap-1">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="hover:bg-red-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {config.emergency_keywords_extra.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Nenhuma palavra extra adicionada</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" /> Resposta de Emergência Personalizada
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para usar a mensagem padrão.
                  </p>
                  <Textarea
                    value={config.emergency_response_custom}
                    onChange={(e) => setConfig(c => ({ ...c, emergency_response_custom: e.target.value }))}
                    rows={6}
                    className="font-mono text-xs"
                    placeholder="Deixe vazio para usar a mensagem padrão: 🚨 EMERGÊNCIA DETECTADA..."
                  />
                </div>
              </div>

              {/* Recent emergencies in security tab too */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Últimas Emergências
                </h3>
                {recentEmergencies.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Tudo seguro!</p>
                    <p className="text-xs text-muted-foreground">Nenhuma emergência registrada</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {recentEmergencies.map((em) => (
                      <div key={em.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] border-red-200 bg-red-50 text-red-700">
                            {em.matched_keyword || "—"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{em.source}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {new Date(em.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{em.message_content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── Playground ─── */}
          <TabsContent value="playground">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-primary" /> Testar Chatbot
                </h3>
                <p className="text-xs text-muted-foreground">
                  Envie uma mensagem de teste para ver como a IA responde com as configurações atuais.
                  {hasChanges && (
                    <span className="text-amber-600 font-semibold"> Salve as alterações antes de testar!</span>
                  )}
                </p>
                <Textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ex: Quais são os benefícios do suplemento Supet?"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), testAI())}
                />
                <Button onClick={testAI} disabled={testLoading || !testPrompt.trim() || hasChanges} className="w-full">
                  {testLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando resposta...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Enviar Teste</>
                  )}
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" /> Resposta da IA
                </h3>
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl bg-muted/30 border border-border/50 p-4">
                  {testResponse ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{testResponse}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <Bot className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-xs">A resposta aparecerá aqui</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Modelo: {selectedModel?.label}</span>
                  <span>Temp: {config.temperature.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Métricas ─── */}
          <TabsContent value="metricas">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{chatCount}</p>
                      <p className="text-[11px] text-muted-foreground">Mensagens (30 dias)</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{emergencyCount}</p>
                      <p className="text-[11px] text-muted-foreground">Emergências (30 dias)</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{activeCredits}</p>
                      <p className="text-[11px] text-muted-foreground">Créditos ativos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage chart */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Uso da IA — Últimos 30 dias
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="mensagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Mensagens" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent emergencies */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Últimas Emergências Detectadas
                </h3>
                {recentEmergencies.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Nenhuma emergência registrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentEmergencies.map((em) => (
                      <div key={em.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] border-red-200 bg-red-50 text-red-700">
                              {em.matched_keyword || "—"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">{em.source}</Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(em.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{em.message_content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
