import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BookOpen, Camera, Loader2, Plus, Trash2, CheckCircle2, Calendar } from "lucide-react";

interface Pet {
  id: string;
  name: string;
}

interface TreatmentLog {
  id: string;
  pet_id: string | null;
  log_date: string;
  notes: string | null;
  photo_url: string | null;
}

export default function TreatmentDiaryTab() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<TreatmentLog[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const [newPetId, setNewPetId] = useState("");

  useEffect(() => {
    if (user) {
      loadLogs();
      loadPets();
    }
  }, [user]);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("treatment_logs")
      .select("*")
      .eq("user_id", user!.id)
      .order("log_date", { ascending: false });
    setLogs((data as TreatmentLog[]) || []);
    setLoading(false);
  };

  const loadPets = async () => {
    const { data } = await supabase.from("pets").select("id, name").eq("user_id", user!.id);
    setPets((data as Pet[]) || []);
  };

  const handleAdd = () => {
    setAdding(true);
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewNotes("");
    setNewPhotoUrl(null);
    setNewPetId(pets.length > 0 ? pets[0].id : "");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("treatment-photos").upload(path, file, { upsert: true });

    if (error) { toast.error("Erro ao enviar foto"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("treatment-photos").getPublicUrl(path);
    setNewPhotoUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("treatment_logs").insert({
      user_id: user.id,
      pet_id: newPetId || null,
      log_date: newDate,
      notes: newNotes || null,
      photo_url: newPhotoUrl || null,
    });

    setSaving(false);
    if (error) toast.error("Erro ao salvar registro");
    else {
      toast.success("Registro adicionado ao diário!");
      setAdding(false);
      loadLogs();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("treatment_logs").delete().eq("id", id);
    if (error) toast.error("Erro ao remover registro");
    else { toast.success("Registro removido"); loadLogs(); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (adding) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
        {pets.length > 0 && (
          <div>
            <label className="mb-1.5 text-sm font-semibold text-foreground">Pet</label>
            <select
              value={newPetId}
              onChange={(e) => setNewPetId(e.target.value)}
              className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Sem pet vinculado</option>
              {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground">Data</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground">Observações</label>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all resize-none"
            placeholder="Como está o tratamento? Notou alguma melhora?"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground">Foto do progresso</label>
          {newPhotoUrl ? (
            <div className="relative">
              <img src={newPhotoUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-2xl" />
              <button
                onClick={() => setNewPhotoUrl(null)}
                className="absolute top-2 right-2 rounded-full bg-destructive/80 p-1.5 text-white hover:bg-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-2xl border-2 border-dashed border-primary/30 py-6 text-sm text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
              {uploading ? "Enviando..." : "Adicionar foto"}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setAdding(false)} className="flex-1 rounded-full bg-supet-bg py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar registro"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      {logs.length === 0 ? (
        <div className="rounded-3xl bg-supet-bg-alt p-10 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-primary/40 mb-3" />
          <p className="text-lg font-semibold text-foreground">Diário vazio</p>
          <p className="text-sm text-muted-foreground mt-1">Registre o progresso do tratamento do seu pet com fotos e anotações.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-primary/20" />

          {logs.map((log, i) => {
            const pet = pets.find((p) => p.id === log.pet_id);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-12 pb-6 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="absolute left-3.5 top-1.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-supet-bg" />

                <div className="rounded-3xl bg-supet-bg-alt p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-primary flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.log_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                      {pet && <p className="text-xs text-muted-foreground mt-0.5">{pet.name}</p>}
                    </div>
                    <button onClick={() => handleDelete(log.id)} className="rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {log.photo_url && (
                    <img src={log.photo_url} alt="Progresso" className="w-full max-h-48 object-cover rounded-2xl mb-3" />
                  )}

                  {log.notes && <p className="text-sm text-foreground/80">{log.notes}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAdd}
        className="w-full rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-bold text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Novo registro
      </button>
    </motion.div>
  );
}
