import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Star, Send, Tag, Plus, Trash2, MessageSquare,
  ArrowRightLeft, Clock, Crown, UserCheck, UserPlus, UserX,
} from "lucide-react";
import type { EnrichedClient } from "./CRMClientList";

interface Props {
  client: EnrichedClient | null;
  onClose: () => void;
  allTags: { id: string; name: string; color: string }[];
  onRefresh: () => void;
}

const statusOptions = [
  { key: "lead", label: "Lead", icon: UserPlus, color: "text-blue-600" },
  { key: "active", label: "Ativo", icon: UserCheck, color: "text-emerald-600" },
  { key: "inactive", label: "Inativo", icon: UserX, color: "text-amber-600" },
  { key: "vip", label: "VIP", icon: Crown, color: "text-violet-600" },
];

export default function CRMClientDrawer({ client, onClose, allTags, onRefresh }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [interactions, setInteractions] = useState<{ id: string; type: string; description: string | null; created_at: string }[]>([]);
  const [pets, setPets] = useState<{ id: string; name: string; breed: string | null }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    const uid = client.user_id;

    Promise.all([
      supabase.from("customer_notes").select("id, content, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      supabase.from("customer_interactions").select("id, type, description, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
      supabase.from("pets").select("id, name, breed").eq("user_id", uid),
    ]).then(([notesRes, intRes, petsRes]) => {
      setNotes((notesRes.data as any[]) || []);
      setInteractions((intRes.data as any[]) || []);
      setPets((petsRes.data as any[]) || []);
    });
  }, [client]);

  if (!client) return null;

  const avgTicket = client.orderCount > 0 ? client.totalSpent / client.orderCount : 0;

  async function handleAddNote() {
    if (!newNote.trim() || !user) return;
    setSaving(true);
    await supabase.from("customer_notes").insert({ user_id: client!.user_id, admin_id: user.id, content: newNote.trim() });
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "note", description: newNote.trim() });
    setNewNote("");
    // Refresh notes
    const { data } = await supabase.from("customer_notes").select("id, content, created_at").eq("user_id", client!.user_id).order("created_at", { ascending: false }).limit(20);
    setNotes((data as any[]) || []);
    const { data: intData } = await supabase.from("customer_interactions").select("id, type, description, created_at").eq("user_id", client!.user_id).order("created_at", { ascending: false }).limit(30);
    setInteractions((intData as any[]) || []);
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    await supabase.from("customer_status").upsert({ user_id: client!.user_id, status: newStatus, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "status_change", description: `Status alterado para ${newStatus}` });
    onRefresh();
  }

  async function handleToggleTag(tagId: string) {
    const hasTag = client!.tags.some((t) => t.id === tagId);
    if (hasTag) {
      await supabase.from("customer_tag_assignments").delete().eq("user_id", client!.user_id).eq("tag_id", tagId);
    } else {
      await supabase.from("customer_tag_assignments").insert({ user_id: client!.user_id, tag_id: tagId });
    }
    const tagName = allTags.find((t) => t.id === tagId)?.name || "";
    await supabase.from("customer_interactions").insert({ user_id: client!.user_id, type: "tag_change", description: `${hasTag ? "Removida" : "Adicionada"} tag: ${tagName}` });
    onRefresh();
  }

  const interactionIcons: Record<string, typeof ShoppingBag> = {
    purchase: ShoppingBag,
    note: MessageSquare,
    status_change: ArrowRightLeft,
    tag_change: Tag,
    contact: Send,
    support: Star,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-supet-text/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-supet-bg z-50 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-supet-bg/95 backdrop-blur-lg z-10 p-6 pb-4 border-b border-border/50">
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {(client.full_name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-extrabold text-foreground">{client.full_name || "Sem nome"}</h2>
              <p className="text-sm text-muted-foreground">{client.phone || "Sem telefone"}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Total gasto</p>
              <p className="text-sm font-extrabold text-foreground">R$ {client.totalSpent.toFixed(0)}</p>
            </div>
            <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-sm font-extrabold text-foreground">R$ {avgTicket.toFixed(0)}</p>
            </div>
            <div className="bg-supet-bg-alt rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-sm font-extrabold text-foreground">{client.orderCount}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Status do funil</p>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStatusChange(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    client.status === s.key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-supet-bg-alt text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Tags</p>
            <div className="flex gap-2 flex-wrap">
              {allTags.map((tag) => {
                const isAssigned = client.tags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isAssigned ? "shadow-sm" : "opacity-40 hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: tag.color + (isAssigned ? "33" : "11"),
                      color: tag.color,
                    }}
                  >
                    {isAssigned ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pets */}
          {pets.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pets cadastrados</p>
              <div className="flex gap-2 flex-wrap">
                {pets.map((pet) => (
                  <span key={pet.id} className="bg-supet-bg-alt px-3 py-1.5 rounded-full text-xs font-semibold text-foreground">
                    🐾 {pet.name}{pet.breed ? ` (${pet.breed})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Notas internas</p>
            <div className="flex gap-2 mb-3">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Adicionar nota..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-supet-bg-alt rounded-2xl p-3 text-xs">
                  <p className="text-foreground">{note.content}</p>
                  <p className="text-muted-foreground mt-1">{new Date(note.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Timeline de interações</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {interactions.map((int) => {
                const Icon = interactionIcons[int.type] || Clock;
                return (
                  <div key={int.id} className="flex items-start gap-3 bg-supet-bg-alt rounded-2xl p-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{int.description || int.type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(int.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                );
              })}
              {interactions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Sem interações registradas</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
