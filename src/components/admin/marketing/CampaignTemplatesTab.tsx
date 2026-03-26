import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Pencil, Trash2, Copy, Eye, Save, X,
  Mail, Sparkles, UserPlus, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import CampaignTemplateEditor from "./CampaignTemplateEditor";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  html_content: string;
  preview_text: string;
  accent_color: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { key: "geral", label: "Geral", icon: Mail },
  { key: "onboarding", label: "Boas-vindas", icon: UserPlus },
  { key: "promocao", label: "Promoção", icon: Sparkles },
  { key: "reengajamento", label: "Reengajamento", icon: RefreshCw },
];

const defaultTemplate = {
  name: "",
  subject: "",
  category: "geral",
  html_content: `<div style="padding:32px;text-align:center;border-radius:16px 16px 0 0;background:#f97316"><h1 style="color:#fff;margin:0;font-size:28px">Título do E-mail</h1></div><div style="padding:32px"><p style="font-size:16px;color:#333;line-height:1.6">Olá <strong>{{nome}}</strong>,</p><p style="font-size:16px;color:#333;line-height:1.6">Escreva o conteúdo do seu e-mail aqui.</p><div style="text-align:center;margin:32px 0"><a href="{{link}}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">Botão de ação</a></div></div>`,
  preview_text: "",
  accent_color: "#f97316",
};

export default function CampaignTemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultTemplate);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const { log } = useAuditLog();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    setTemplates((data || []) as Template[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Nome e assunto são obrigatórios");
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("campaign_templates")
        .update({
          name: form.name,
          subject: form.subject,
          category: form.category,
          html_content: form.html_content,
          preview_text: form.preview_text,
          accent_color: form.accent_color,
        })
        .eq("id", editingId);
      if (error) { toast.error("Erro ao salvar template"); setSaving(false); return; }
      log({ action: "update", entity_type: "campaign_template", entity_id: editingId });
      toast.success("Template atualizado!");
    } else {
      const { data, error } = await supabase
        .from("campaign_templates")
        .insert({
          name: form.name,
          subject: form.subject,
          category: form.category,
          html_content: form.html_content,
          preview_text: form.preview_text,
          accent_color: form.accent_color,
        } as any)
        .select()
        .single();
      if (error) { toast.error("Erro ao criar template"); setSaving(false); return; }
      log({ action: "create", entity_type: "campaign_template", entity_id: (data as any)?.id });
      toast.success("Template criado!");
    }

    setForm(defaultTemplate);
    setEditingId(null);
    setShowCreate(false);
    setSaving(false);
    fetchTemplates();
  };

  const handleEdit = (t: Template) => {
    setForm({
      name: t.name,
      subject: t.subject,
      category: t.category,
      html_content: t.html_content,
      preview_text: t.preview_text,
      accent_color: t.accent_color,
    });
    setEditingId(t.id);
    setShowCreate(true);
    setPreviewId(null);
  };

  const handleDuplicate = (t: Template) => {
    setForm({
      name: t.name + " (cópia)",
      subject: t.subject,
      category: t.category,
      html_content: t.html_content,
      preview_text: t.preview_text,
      accent_color: t.accent_color,
    });
    setEditingId(null);
    setShowCreate(true);
    toast.success("Template duplicado — edite e salve!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campaign_templates").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir template"); return; }
    log({ action: "delete", entity_type: "campaign_template", entity_id: id });
    toast.success("Template excluído");
    fetchTemplates();
  };

  const cancelEdit = () => {
    setForm(defaultTemplate);
    setEditingId(null);
    setShowCreate(false);
  };

  const filtered = templates.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  const getCategoryInfo = (key: string) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(filterCategory === cat.key ? "" : cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === cat.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm(defaultTemplate); setEditingId(null); setShowCreate(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Template
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-foreground">
                  {editingId ? "Editar Template" : "Novo Template"}
                </h3>
                <button onClick={cancelEdit} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome do template</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Black Friday"
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assunto do e-mail</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Ex: 🔥 Oferta especial!"
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cor</label>
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                      className="w-12 h-[46px] rounded-2xl cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Preview text (inbox)</label>
                <input
                  value={form.preview_text}
                  onChange={(e) => setForm({ ...form, preview_text: e.target.value })}
                  placeholder="Texto que aparece na prévia do e-mail na caixa de entrada..."
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Rich-text editor */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Conteúdo do e-mail</label>
                <CampaignTemplateEditor
                  value={form.html_content}
                  onChange={(html) => setForm({ ...form, html_content: html })}
                  accentColor={form.accent_color}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={cancelEdit} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.subject.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar template"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template preview modal */}
      <AnimatePresence>
        {previewId && (() => {
          const t = templates.find((tp) => tp.id === previewId);
          if (!t) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setPreviewId(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">Assunto: {t.subject}</p>
                  </div>
                  <button onClick={() => setPreviewId(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">${t.html_content}</div>`,
                  }}
                />
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-3xl p-5 animate-pulse">
              <div className="h-40 rounded-2xl bg-border mb-4" />
              <div className="h-4 w-32 rounded-full bg-border mb-2" />
              <div className="h-3 w-48 rounded-full bg-border" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center text-muted-foreground text-sm">
          {templates.length === 0 ? "Nenhum template criado ainda." : "Nenhum template encontrado nessa categoria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const catInfo = getCategoryInfo(t.category);
            const CatIcon = catInfo.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-3xl overflow-hidden group hover:shadow-lg transition-shadow"
              >
                {/* Mini preview */}
                <div
                  className="h-44 overflow-hidden relative cursor-pointer"
                  onClick={() => setPreviewId(t.id)}
                >
                  <div
                    className="transform scale-[0.4] origin-top-left w-[250%]"
                    dangerouslySetInnerHTML={{
                      __html: `<div style="font-family:Arial,sans-serif">${t.html_content}</div>`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-foreground bg-card/90 px-3 py-1.5 rounded-full shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                    </div>
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{ background: `${t.accent_color}20`, color: t.accent_color }}
                    >
                      <CatIcon className="w-3 h-3" />
                      {catInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-3">
                    <button
                      onClick={() => handleEdit(t)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDuplicate(t)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
