import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, PawPrint, Clock, UserX, ShoppingBag, Star, Gift,
  Play, Settings2, ChevronDown, ChevronUp, Activity,
  BarChart3, Bell, Save, Loader2, Plus, Trash2, Copy,
  TrendingUp, AlertTriangle, CheckCircle2, Info, X,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: any;
  action_type: string;
  action_config: any;
  enabled: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Execution {
  id: string;
  automation_id: string;
  user_id: string;
  action_taken: string;
  metadata: any;
  created_at: string;
}

const triggerInfo: Record<string, { label: string; icon: typeof PawPrint; color: string; description: string; variables: string[] }> = {
  pet_birthday: { label: "Aniversário do Pet", icon: PawPrint, color: "#ec4899", description: "Quando o pet faz aniversário", variables: ["{{pet_nome}}"] },
  inactive_customer: { label: "Cliente Inativo", icon: UserX, color: "#f59e0b", description: "Sem compras há X dias", variables: [] },
  post_purchase: { label: "Pós-Compra", icon: ShoppingBag, color: "#10b981", description: "X dias após uma compra", variables: [] },
  welcome_no_purchase: { label: "Boas-vindas", icon: Gift, color: "#3b82f6", description: "Novo cadastro sem compra", variables: [] },
  post_delivery: { label: "Pós-Entrega", icon: Star, color: "#8b5cf6", description: "X dias após entrega", variables: [] },
  restock_reminder: { label: "Lembrete Reposição", icon: AlertTriangle, color: "#ef4444", description: "Produto próximo de acabar", variables: ["{{produto}}"] },
};

const actionLabels: Record<string, string> = {
  notification: "Notificação",
  coupon: "Cupom",
  both: "Notificação + Cupom",
};

const defaultCreateForm = {
  name: "",
  description: "",
  trigger_type: "pet_birthday",
  action_type: "notification",
  trigger_config: {} as any,
  action_config: {
    notification_title: "",
    notification_message: "",
    coupon_discount_type: "percentage",
    coupon_discount_value: 10,
    coupon_min_order: 0,
    coupon_expires_days: 14,
  } as any,
};

export default function AutomationsTab() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...defaultCreateForm });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { log } = useAuditLog();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [autoRes, execRes] = await Promise.all([
      supabase.from("marketing_automations").select("*").order("created_at"),
      supabase.from("automation_executions").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setAutomations((autoRes.data || []) as Automation[]);
    setExecutions((execRes.data || []) as Execution[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleEnabled = async (auto: Automation) => {
    const { error } = await supabase
      .from("marketing_automations")
      .update({ enabled: !auto.enabled })
      .eq("id", auto.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    log({ action: "update", entity_type: "marketing_automation", entity_id: auto.id, details: { enabled: !auto.enabled } });
    toast.success(auto.enabled ? "Automação desativada" : "Automação ativada! 🚀");
    fetchData();
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-automations", { body: { time: "manual" } });
      if (error) throw error;
      const results = data?.results || {};
      const total = Object.values(results).reduce((s: number, v: any) => s + (v > 0 ? v : 0), 0);
      toast.success(`Automações executadas! ${total} ações disparadas.`);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao executar: " + (err.message || ""));
    }
    setRunning(false);
  };

  const startEdit = (auto: Automation) => {
    setEditingId(auto.id);
    setEditForm({
      name: auto.name,
      description: auto.description,
      action_type: auto.action_type,
      trigger_config: { ...auto.trigger_config },
      action_config: { ...auto.action_config },
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;
    setSaving(true);
    const { error } = await supabase
      .from("marketing_automations")
      .update({
        name: editForm.name,
        description: editForm.description,
        action_type: editForm.action_type,
        trigger_config: editForm.trigger_config,
        action_config: editForm.action_config,
      })
      .eq("id", editingId);
    if (error) { toast.error("Erro ao salvar"); setSaving(false); return; }
    log({ action: "update", entity_type: "marketing_automation", entity_id: editingId });
    toast.success("Automação atualizada!");
    setEditingId(null);
    setEditForm(null);
    setSaving(false);
    fetchData();
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) { toast.error("Preencha o nome"); return; }
    setCreating(true);
    const { error } = await supabase.from("marketing_automations").insert({
      name: createForm.name,
      description: createForm.description,
      trigger_type: createForm.trigger_type,
      action_type: createForm.action_type,
      trigger_config: createForm.trigger_config,
      action_config: createForm.action_config,
      enabled: false,
    });
    if (error) { toast.error("Erro ao criar automação"); setCreating(false); return; }
    log({ action: "create", entity_type: "marketing_automation", details: { name: createForm.name } });
    toast.success("Automação criada! Ative para começar a usar.");
    setCreateForm({ ...defaultCreateForm });
    setShowCreate(false);
    setCreating(false);
    fetchData();
  };

  const handleDuplicate = async (auto: Automation) => {
    const { error } = await supabase.from("marketing_automations").insert({
      name: auto.name + " (cópia)",
      description: auto.description,
      trigger_type: auto.trigger_type,
      action_type: auto.action_type,
      trigger_config: auto.trigger_config,
      action_config: auto.action_config,
      enabled: false,
    });
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success("Automação duplicada!");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    // Delete executions first
    await supabase.from("automation_executions").delete().eq("automation_id", id);
    const { error } = await supabase.from("marketing_automations").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); setDeleting(null); return; }
    log({ action: "delete", entity_type: "marketing_automation", entity_id: id });
    toast.success("Automação excluída");
    setDeleting(null);
    fetchData();
  };

  // Stats
  const totalEnabled = automations.filter((a) => a.enabled).length;
  const totalExecutions = executions.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayExecs = executions.filter((e) => e.created_at.startsWith(todayStr)).length;
  const execsByAutomation = (autoId: string) => executions.filter((e) => e.automation_id === autoId);

  // 7-day execution chart data
  const last7Days = useMemo(() => {
    const days: { label: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      days.push({
        label: dayLabel,
        date: dateStr,
        count: executions.filter((e) => e.created_at.startsWith(dateStr)).length,
      });
    }
    return days;
  }, [executions]);

  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));

  // Success rate (executions with metadata containing errors = -1 results)
  const successRate = totalExecutions > 0 ? 100 : 0; // All logged executions are successful

  const renderTriggerConfig = (triggerType: string, config: any, onChange: (c: any) => void) => {
    switch (triggerType) {
      case "pet_birthday":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias antes</label>
            <input type="number" value={config.days_before ?? 0}
              onChange={(e) => onChange({ ...config, days_before: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "inactive_customer":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias inativo</label>
            <input type="number" value={config.days_inactive ?? 60}
              onChange={(e) => onChange({ ...config, days_inactive: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "post_purchase":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias após compra</label>
            <input type="number" value={config.days_after ?? 3}
              onChange={(e) => onChange({ ...config, days_after: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "welcome_no_purchase":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias após cadastro</label>
            <input type="number" value={config.days_after_signup ?? 3}
              onChange={(e) => onChange({ ...config, days_after_signup: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "post_delivery":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias após entrega</label>
            <input type="number" value={config.days_after_delivery ?? 5}
              onChange={(e) => onChange({ ...config, days_after_delivery: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "restock_reminder":
        return (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Dias antes do fim estimado</label>
            <input type="number" value={config.days_before_end ?? 5}
              onChange={(e) => onChange({ ...config, days_before_end: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionConfig = (actionType: string, config: any, onChange: (c: any) => void, triggerType?: string) => {
    const vars = triggerInfo[triggerType || ""]?.variables || [];
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Título da notificação</label>
            <input value={config.notification_title || ""}
              onChange={(e) => onChange({ ...config, notification_title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Mensagem</label>
            <input value={config.notification_message || ""}
              onChange={(e) => onChange({ ...config, notification_message: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        {vars.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              Variáveis disponíveis: {vars.map((v) => (
                <code key={v} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px] font-mono mx-0.5">{v}</code>
              ))}
            </p>
          </div>
        )}
        {(actionType === "coupon" || actionType === "both") && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Tipo desconto</label>
              <select value={config.coupon_discount_type || "percentage"}
                onChange={(e) => onChange({ ...config, coupon_discount_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Valor</label>
              <input type="number" value={config.coupon_discount_value || 10}
                onChange={(e) => onChange({ ...config, coupon_discount_value: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Pedido mín.</label>
              <input type="number" value={config.coupon_min_order || 0}
                onChange={(e) => onChange({ ...config, coupon_min_order: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Validade (dias)</label>
              <input type="number" value={config.coupon_expires_days || 14}
                onChange={(e) => onChange({ ...config, coupon_expires_days: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Automações", value: automations.length, icon: Zap, color: "bg-primary/15 text-primary" },
          { label: "Ativas", value: totalEnabled, icon: Play, color: "bg-emerald-500/15 text-emerald-600" },
          { label: "Execuções totais", value: totalExecutions, icon: Activity, color: "bg-violet-500/15 text-violet-600" },
          { label: "Hoje", value: todayExecs, icon: BarChart3, color: "bg-amber-500/15 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-3xl p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 7-day execution chart */}
      <div className="bg-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Execuções — últimos 7 dias</p>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Taxa de sucesso: <span className="text-emerald-600 font-bold">{successRate}%</span></span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-24">
          {last7Days.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-foreground">{day.count}</span>
              <div
                className="w-full rounded-xl bg-primary/80 transition-all min-h-[4px]"
                style={{ height: `${(day.count / maxDayCount) * 100}%` }}
              />
              <span className="text-[9px] text-muted-foreground capitalize">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-card border border-border/50 text-foreground font-semibold text-sm hover:bg-muted transition-all"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Nova Automação"}
        </button>
        <button
          onClick={handleRunNow}
          disabled={running || totalEnabled === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Executando..." : "Executar agora"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-3xl p-6 space-y-5">
              <h3 className="text-lg font-extrabold text-foreground">Nova Automação</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Cupom de aniversário"
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Gatilho</label>
                  <select
                    value={createForm.trigger_type}
                    onChange={(e) => setCreateForm({ ...createForm, trigger_type: e.target.value, trigger_config: {} })}
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(triggerInfo).map(([key, info]) => (
                      <option key={key} value={key}>{info.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
                <input
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Descreva o objetivo desta automação"
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ação</label>
                <select
                  value={createForm.action_type}
                  onChange={(e) => setCreateForm({ ...createForm, action_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-xs"
                >
                  <option value="notification">Notificação</option>
                  <option value="coupon">Cupom</option>
                  <option value="both">Notificação + Cupom</option>
                </select>
              </div>

              {/* Trigger config */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração do gatilho</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {renderTriggerConfig(createForm.trigger_type, createForm.trigger_config, (c) => setCreateForm({ ...createForm, trigger_config: c }))}
                </div>
              </div>

              {/* Action config */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração da ação</p>
                {renderActionConfig(createForm.action_type, createForm.action_config, (c) => setCreateForm({ ...createForm, action_config: c }), createForm.trigger_type)}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? "Criando..." : "Criar Automação"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automation cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-3xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-border" />
                <div className="h-3 w-56 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">Nenhuma automação criada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira automação para engajar clientes automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto, i) => {
            const info = triggerInfo[auto.trigger_type] || { label: auto.trigger_type, icon: Zap, color: "#666", description: "", variables: [] };
            const TriggerIcon = info.icon;
            const isExpanded = expandedId === auto.id;
            const isEditing = editingId === auto.id;
            const autoExecs = execsByAutomation(auto.id);
            const uniqueUsers = new Set(autoExecs.map((e) => e.user_id)).size;

            return (
              <motion.div
                key={auto.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-3xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${info.color}20` }}
                  >
                    <TriggerIcon className="w-6 h-6" style={{ color: info.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{auto.name}</p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${info.color}15`, color: info.color }}
                      >
                        {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{auto.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {actionLabels[auto.action_type] || auto.action_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {autoExecs.length} execuções
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <UserX className="w-3 h-3" /> {uniqueUsers} usuários
                      </span>
                      {auto.last_run_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(auto.last_run_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={auto.enabled} onCheckedChange={() => toggleEnabled(auto)} />
                    <button onClick={() => handleDuplicate(auto)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Duplicar">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEdit(auto)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(auto.id)}
                      disabled={deleting === auto.id}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                      {deleting === auto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : auto.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                <AnimatePresence>
                  {isEditing && editForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
                            <input value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ação</label>
                            <select value={editForm.action_type}
                              onChange={(e) => setEditForm({ ...editForm, action_type: e.target.value })}
                              className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                              <option value="notification">Notificação</option>
                              <option value="coupon">Cupom</option>
                              <option value="both">Notificação + Cupom</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
                          <input value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração do gatilho</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {renderTriggerConfig(auto.trigger_type, editForm.trigger_config, (c) => setEditForm({ ...editForm, trigger_config: c }))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração da ação</p>
                          {renderActionConfig(editForm.action_type, editForm.action_config, (c) => setEditForm({ ...editForm, action_config: c }), auto.trigger_type)}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setEditingId(null); setEditForm(null); }}
                            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                          <button onClick={saveEdit} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md disabled:opacity-50">
                            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded: execution log */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-border/50 pt-4">
                        {/* Mini chart for this automation */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Execuções recentes</p>
                            <div className="flex items-end gap-1 h-12">
                              {(() => {
                                const days: { date: string; count: number }[] = [];
                                for (let i = 13; i >= 0; i--) {
                                  const d = new Date();
                                  d.setDate(d.getDate() - i);
                                  const ds = d.toISOString().split("T")[0];
                                  days.push({ date: ds, count: autoExecs.filter((e) => e.created_at.startsWith(ds)).length });
                                }
                                const max = Math.max(1, ...days.map((d) => d.count));
                                return days.map((d) => (
                                  <div key={d.date} className="flex-1 rounded-sm bg-primary/60 min-h-[2px] transition-all"
                                    style={{ height: `${(d.count / max) * 100}%` }}
                                    title={`${d.date}: ${d.count}`} />
                                ));
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-extrabold text-foreground">{autoExecs.length}</p>
                            <p className="text-[10px] text-muted-foreground">total execuções</p>
                            <p className="text-xs font-bold text-primary">{uniqueUsers} usuários</p>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-muted-foreground mb-3">Histórico</p>
                        {autoExecs.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhuma execução registrada.</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-auto">
                            {autoExecs.slice(0, 30).map((exec) => (
                              <div key={exec.id} className="flex items-center gap-3 py-1.5 text-xs">
                                <span className="text-muted-foreground w-36 flex-shrink-0">
                                  {new Date(exec.created_at).toLocaleString("pt-BR")}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">
                                  {exec.user_id.slice(0, 8)}...
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  exec.action_taken === "both" ? "bg-violet-500/15 text-violet-600"
                                    : exec.action_taken === "coupon" ? "bg-amber-500/15 text-amber-600"
                                    : "bg-emerald-500/15 text-emerald-600"
                                }`}>
                                  {actionLabels[exec.action_taken] || exec.action_taken}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-card rounded-3xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Execução automática</p>
          <p className="text-xs text-muted-foreground mt-1">
            As automações ativas são verificadas diariamente às 9h. Cada usuário recebe no máximo uma ação por automação por dia.
            Use o botão "Nova Automação" para criar gatilhos personalizados ou "Executar agora" para rodar manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}
