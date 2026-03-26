import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, PawPrint, Clock, UserX, ShoppingBag, Star, Gift,
  Play, Pause, Settings2, ChevronDown, ChevronUp, Activity,
  BarChart3, Users, Bell, Percent, Pencil, Save, X, Loader2,
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

const triggerInfo: Record<string, { label: string; icon: typeof PawPrint; color: string; description: string }> = {
  pet_birthday: { label: "Aniversário do Pet", icon: PawPrint, color: "#ec4899", description: "Quando o pet faz aniversário" },
  inactive_customer: { label: "Cliente Inativo", icon: UserX, color: "#f59e0b", description: "Sem compras há X dias" },
  post_purchase: { label: "Pós-Compra", icon: ShoppingBag, color: "#10b981", description: "X dias após uma compra" },
  welcome_no_purchase: { label: "Boas-vindas", icon: Gift, color: "#3b82f6", description: "Novo cadastro sem compra" },
  post_delivery: { label: "Pós-Entrega", icon: Star, color: "#8b5cf6", description: "X dias após entrega" },
};

const actionLabels: Record<string, string> = {
  notification: "Notificação",
  coupon: "Cupom",
  both: "Notificação + Cupom",
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
  const { log } = useAuditLog();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [autoRes, execRes] = await Promise.all([
      supabase.from("marketing_automations").select("*").order("created_at"),
      supabase.from("automation_executions").select("*").order("created_at", { ascending: false }).limit(200),
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
      const { data, error } = await supabase.functions.invoke("run-automations", {
        body: { time: "manual" },
      });
      if (error) throw error;
      const results = data?.results || {};
      const total = Object.values(results).reduce((s: number, v: any) => s + (v > 0 ? v : 0), 0);
      toast.success(`Automações executadas! ${total} ações disparadas.`);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao executar automações: " + (err.message || ""));
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

  // Stats
  const totalEnabled = automations.filter((a) => a.enabled).length;
  const totalExecutions = executions.length;
  const todayExecs = executions.filter((e) => e.created_at.startsWith(new Date().toISOString().split("T")[0])).length;
  const execsByAutomation = (autoId: string) => executions.filter((e) => e.automation_id === autoId);

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

      {/* Run manually */}
      <div className="flex justify-end">
        <button
          onClick={handleRunNow}
          disabled={running || totalEnabled === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Executando..." : "Executar agora"}
        </button>
      </div>

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
      ) : (
        <div className="space-y-3">
          {automations.map((auto, i) => {
            const info = triggerInfo[auto.trigger_type] || { label: auto.trigger_type, icon: Zap, color: "#666", description: "" };
            const TriggerIcon = info.icon;
            const isExpanded = expandedId === auto.id;
            const isEditing = editingId === auto.id;
            const autoExecs = execsByAutomation(auto.id);
            const lastExecCount = autoExecs.length;

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
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {actionLabels[auto.action_type] || auto.action_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {lastExecCount} execuções
                      </span>
                      {auto.last_run_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Último: {new Date(auto.last_run_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch
                      checked={auto.enabled}
                      onCheckedChange={() => toggleEnabled(auto)}
                    />
                    <button
                      onClick={() => startEdit(auto)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : auto.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                <AnimatePresence>
                  {isEditing && editForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
                            <input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ação</label>
                            <select
                              value={editForm.action_type}
                              onChange={(e) => setEditForm({ ...editForm, action_type: e.target.value })}
                              className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value="notification">Notificação</option>
                              <option value="coupon">Cupom</option>
                              <option value="both">Notificação + Cupom</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
                          <input
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>

                        {/* Trigger config */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração do gatilho</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {auto.trigger_type === "pet_birthday" && (
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Dias antes</label>
                                <input
                                  type="number"
                                  value={editForm.trigger_config.days_before ?? 0}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_config: { ...editForm.trigger_config, days_before: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                            {auto.trigger_type === "inactive_customer" && (
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Dias inativo</label>
                                <input
                                  type="number"
                                  value={editForm.trigger_config.days_inactive ?? 60}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_config: { ...editForm.trigger_config, days_inactive: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                            {auto.trigger_type === "post_purchase" && (
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Dias após compra</label>
                                <input
                                  type="number"
                                  value={editForm.trigger_config.days_after ?? 3}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_config: { ...editForm.trigger_config, days_after: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                            {auto.trigger_type === "welcome_no_purchase" && (
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Dias após cadastro</label>
                                <input
                                  type="number"
                                  value={editForm.trigger_config.days_after_signup ?? 3}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_config: { ...editForm.trigger_config, days_after_signup: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                            {auto.trigger_type === "post_delivery" && (
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Dias após entrega</label>
                                <input
                                  type="number"
                                  value={editForm.trigger_config.days_after_delivery ?? 5}
                                  onChange={(e) => setEditForm({ ...editForm, trigger_config: { ...editForm.trigger_config, days_after_delivery: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action config */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Configuração da ação</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">Título da notificação</label>
                              <input
                                value={editForm.action_config.notification_title || ""}
                                onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, notification_title: e.target.value } })}
                                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">Mensagem</label>
                              <input
                                value={editForm.action_config.notification_message || ""}
                                onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, notification_message: e.target.value } })}
                                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                          </div>
                          {(editForm.action_type === "coupon" || editForm.action_type === "both") && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Tipo desconto</label>
                                <select
                                  value={editForm.action_config.coupon_discount_type || "percentage"}
                                  onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, coupon_discount_type: e.target.value } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  <option value="percentage">%</option>
                                  <option value="fixed">R$</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Valor</label>
                                <input
                                  type="number"
                                  value={editForm.action_config.coupon_discount_value || 10}
                                  onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, coupon_discount_value: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Pedido mín.</label>
                                <input
                                  type="number"
                                  value={editForm.action_config.coupon_min_order || 0}
                                  onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, coupon_min_order: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Validade (dias)</label>
                                <input
                                  type="number"
                                  value={editForm.action_config.coupon_expires_days || 14}
                                  onChange={(e) => setEditForm({ ...editForm, action_config: { ...editForm.action_config, coupon_expires_days: Number(e.target.value) } })}
                                  className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => { setEditingId(null); setEditForm(null); }}
                            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded: execution log */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border/50 pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Últimas execuções</p>
                        {autoExecs.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhuma execução registrada.</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-auto">
                            {autoExecs.slice(0, 20).map((exec) => (
                              <div key={exec.id} className="flex items-center gap-3 py-1.5 text-xs">
                                <span className="text-muted-foreground w-36 flex-shrink-0">
                                  {new Date(exec.created_at).toLocaleString("pt-BR")}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">
                                  {exec.user_id.slice(0, 8)}...
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  exec.action_taken === "both"
                                    ? "bg-violet-500/15 text-violet-600"
                                    : exec.action_taken === "coupon"
                                    ? "bg-amber-500/15 text-amber-600"
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
            As automações ativas são verificadas diariamente às 9h. Cada usuário recebe no máximo uma ação por automação por dia
            para evitar spam. Você também pode executar manualmente clicando em "Executar agora".
          </p>
        </div>
      </div>
    </div>
  );
}
