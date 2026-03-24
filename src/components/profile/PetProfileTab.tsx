import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, ChevronDown, ChevronUp, Loader2, PawPrint, Plus, Trash2,
  CheckCircle2, Heart, Zap, Clock, AlertTriangle, Scissors, Activity, Info,
  Scale, Cake, Sparkles,
} from "lucide-react";
import { DOG_BREEDS } from "@/data/dogBreeds";
import { BREED_INFO, type BreedDetails, getPorteColor, getEnergiaColor } from "@/data/breedInfo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Pet {
  id: string;
  name: string;
  breed: string | null;
  weight_kg: number | null;
  birth_date: string | null;
  photo_url: string | null;
}

/* ─── Skeleton ─── */
function PetSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-supet-bg-alt p-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-border/60 flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-5 w-28 rounded-full bg-border/60" />
              <div className="h-3.5 w-36 rounded-full bg-border/40" />
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-border/30" />
                <div className="h-5 w-20 rounded-full bg-border/30" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Delete Confirmation ─── */
function DeleteConfirmation({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-supet-bg-alt p-7 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive/10 mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-base font-bold text-foreground text-center mb-1">Remover {name}?</p>
        <p className="text-sm text-muted-foreground text-center mb-6">Os dados do pet serão removidos permanentemente.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-supet-bg py-2.5 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors">Remover</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Breed Combobox ─── */
function BreedCombobox({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const isKnownBreed = !value || DOG_BREEDS.includes(value) || value === "Outra";

  if (showCustom || (!isKnownBreed && value)) {
    return (
      <div className="flex gap-2">
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
          placeholder="Digite a raça..."
          autoFocus
        />
        <button type="button" onClick={() => { setShowCustom(false); onChange(""); }} className="rounded-full bg-supet-bg px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-border transition-colors">
          Lista
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-left outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all flex items-center justify-between">
          <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || "Selecionar raça..."}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar raça..." />
          <CommandList>
            <CommandEmpty>Nenhuma raça encontrada.</CommandEmpty>
            <CommandGroup>
              {DOG_BREEDS.map((breed) => (
                <CommandItem key={breed} value={breed} onSelect={(val) => { if (val === "Outra") { setShowCustom(true); onChange(""); } else { onChange(val); } setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${value === breed ? "opacity-100" : "opacity-0"}`} />
                  {breed}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Breed Info Card (edit mode) ─── */
function BreedInfoCard({ breed }: { breed: string }) {
  const info = BREED_INFO[breed];
  if (!info) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPorteColor(info.porte)}`}>{info.porte}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getEnergiaColor(info.energia)}`}>⚡ {info.energia}</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{info.expectativaVida}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-1.5"><Scissors className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" /><span><strong>Pelagem:</strong> {info.pelagem}</span></div>
        <div className="flex items-start gap-1.5"><Activity className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" /><span><strong>Exercício:</strong> {info.exercicio}</span></div>
      </div>
      <div className="flex items-start gap-1.5 text-xs"><Heart className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" /><span><strong>Temperamento:</strong> {info.temperamento.join(", ")}</span></div>
      {info.predisposicoes.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" /><span><strong>Atenção:</strong> {info.predisposicoes.join(", ")}</span></div>
      )}
      {info.cuidadosEspeciais.length > 0 && (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-foreground flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /> Cuidados especiais:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-1">
            {info.cuidadosEspeciais.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Expandable Breed Info (list mode) ─── */
function ExpandableBreedInfo({ info }: { info: BreedDetails }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border/30">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-6 py-3 flex items-center justify-between text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
        <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Guia completo da raça</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Scissors className="h-3 w-3 text-primary" /> Pelagem
                  </div>
                  <p className="text-xs text-foreground font-medium">{info.pelagem}</p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Activity className="h-3 w-3 text-primary" /> Exercício
                  </div>
                  <p className="text-xs text-foreground font-medium">{info.exercicio}</p>
                </div>
              </div>

              {/* Temperament */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3 text-primary" /> Temperamento</p>
                <div className="flex flex-wrap gap-1.5">
                  {info.temperamento.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-primary/8 text-[11px] font-medium text-primary">{t}</span>
                  ))}
                </div>
              </div>

              {/* Health alerts */}
              {info.predisposicoes.length > 0 && (
                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Predisposições</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.predisposicoes.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-medium text-amber-700 dark:text-amber-400">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special care */}
              {info.cuidadosEspeciais.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Cuidados especiais</p>
                  <div className="space-y-1">
                    {info.cuidadosEspeciais.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pet Card ─── */
function PetCard({ pet, index, onEdit, onDelete, calcAge }: {
  pet: Pet;
  index: number;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  calcAge: (d: string | null) => string | null;
}) {
  const breedInfo = pet.breed ? BREED_INFO[pet.breed] : null;
  const age = calcAge(pet.birth_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", damping: 20 }}
      className="group rounded-3xl bg-supet-bg-alt overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-300"
    >
      {/* Main card content */}
      <div className="relative p-5 sm:p-6">
        {/* Decorative dot */}
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/20" />

        <div className="flex items-start gap-4 sm:gap-5">
          {/* Avatar with ring */}
          <div className="relative flex-shrink-0">
            <div className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-[3px]">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-supet-bg">
                  <PawPrint className="h-8 w-8 text-primary/30" />
                </div>
              )}
            </div>
            {breedInfo && (
              <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${getPorteColor(breedInfo.porte)}`}>
                {breedInfo.porte}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-lg font-bold text-foreground truncate leading-tight">{pet.name}</h3>
              {pet.breed && (
                <p className="text-sm text-muted-foreground mt-0.5">{pet.breed}</p>
              )}
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-2">
              {pet.weight_kg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-supet-bg text-[11px] font-medium text-muted-foreground">
                  <Scale className="h-3 w-3 text-primary/60" />
                  {pet.weight_kg} kg
                </span>
              )}
              {age && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-supet-bg text-[11px] font-medium text-muted-foreground">
                  <Cake className="h-3 w-3 text-primary/60" />
                  {age}
                </span>
              )}
              {breedInfo && (
                <>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${getEnergiaColor(breedInfo.energia)}`}>
                    ⚡ {breedInfo.energia}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-supet-bg text-[11px] font-medium text-muted-foreground">
                    <Clock className="h-3 w-3 text-primary/60" />
                    {breedInfo.expectativaVida}
                  </span>
                </>
              )}
            </div>

            {/* Quick health highlights */}
            {breedInfo && breedInfo.predisposicoes.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {breedInfo.predisposicoes.slice(0, 2).join(" · ")}
                  {breedInfo.predisposicoes.length > 2 && ` +${breedInfo.predisposicoes.length - 2}`}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
            <button onClick={() => onEdit(pet)} className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
              Editar
            </button>
            <button onClick={() => onDelete(pet)} className="rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors self-center">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable breed guide */}
      {breedInfo && <ExpandableBreedInfo info={breedInfo} />}
    </motion.div>
  );
}

/* ─── Main Component ─── */
export default function PetProfileTab() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingPet, setEditingPet] = useState<Partial<Pet> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null);

  useEffect(() => {
    if (user) loadPets();
  }, [user]);

  const loadPets = async () => {
    setLoading(true);
    const { data } = await supabase.from("pets").select("*").eq("user_id", user!.id).order("created_at", { ascending: true });
    setPets((data as Pet[]) || []);
    setLoading(false);
  };

  const handleAdd = () => { setEditingPet({ name: "", breed: "", weight_kg: null, birth_date: null, photo_url: null }); setIsNew(true); };
  const handleEdit = (pet: Pet) => { setEditingPet({ ...pet }); setIsNew(false); };
  const handleCancel = () => { setEditingPet(null); setIsNew(false); };

  const handleSave = async () => {
    if (!editingPet?.name?.trim() || !user) return;
    setSaving(true);
    if (isNew) {
      const { error } = await supabase.from("pets").insert({ user_id: user.id, name: editingPet.name, breed: editingPet.breed || null, weight_kg: editingPet.weight_kg || null, birth_date: editingPet.birth_date || null, photo_url: editingPet.photo_url || null });
      if (error) toast.error("Erro ao adicionar pet"); else toast.success("Pet adicionado! 🐾");
    } else {
      const { error } = await supabase.from("pets").update({ name: editingPet.name, breed: editingPet.breed || null, weight_kg: editingPet.weight_kg || null, birth_date: editingPet.birth_date || null, photo_url: editingPet.photo_url || null }).eq("id", editingPet.id!);
      if (error) toast.error("Erro ao atualizar pet"); else toast.success("Pet atualizado! ✨");
    }
    setSaving(false); setEditingPet(null); setIsNew(false); loadPets();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("pets").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Erro ao remover pet"); else { toast.success("Pet removido"); loadPets(); }
    setDeleteTarget(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("pet-photos").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar foto"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
    setEditingPet((prev) => prev ? { ...prev, photo_url: urlData.publicUrl } : prev);
    setUploading(false);
  };

  const calcAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (totalMonths < 12) return `${totalMonths} meses`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y} ano${y > 1 ? "s" : ""} e ${m} mês${m > 1 ? "es" : ""}` : `${y} ano${y > 1 ? "s" : ""}`;
  };

  if (loading) return <PetSkeleton />;

  /* ─── Edit / Add Form ─── */
  if (editingPet) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-supet-bg-alt p-6 sm:p-8 space-y-5">
        <div className="flex justify-center">
          <div className="relative h-24 w-24">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-[3px]">
              {editingPet.photo_url ? (
                <img src={editingPet.photo_url} alt="Pet" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-supet-bg">
                  <PawPrint className="h-10 w-10 text-primary/30" />
                </div>
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"><PawPrint className="h-4 w-4 text-primary" /> Nome do pet *</label>
          <input value={editingPet.name || ""} onChange={(e) => setEditingPet((p) => p ? { ...p, name: e.target.value } : p)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="Ex: Thor" />
        </div>
        <div>
          <label className="mb-1.5 text-sm font-semibold text-foreground block">Raça</label>
          <BreedCombobox value={editingPet.breed || ""} onChange={(val) => setEditingPet((p) => p ? { ...p, breed: val } : p)} />
        </div>
        {editingPet.breed && BREED_INFO[editingPet.breed] && <BreedInfoCard breed={editingPet.breed} />}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 text-sm font-semibold text-foreground flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 text-primary" /> Peso (kg)</label>
            <input type="number" step="0.1" value={editingPet.weight_kg ?? ""} onChange={(e) => setEditingPet((p) => p ? { ...p, weight_kg: e.target.value ? Number(e.target.value) : null } : p)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" placeholder="0.0" />
          </div>
          <div>
            <label className="mb-1.5 text-sm font-semibold text-foreground flex items-center gap-1.5"><Cake className="h-3.5 w-3.5 text-primary" /> Nascimento</label>
            <input type="date" value={editingPet.birth_date || ""} onChange={(e) => setEditingPet((p) => p ? { ...p, birth_date: e.target.value || null } : p)} className="w-full rounded-full bg-supet-bg px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCancel} className="flex-1 rounded-full bg-supet-bg py-3 text-sm font-bold text-foreground hover:bg-border transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !editingPet.name?.trim()} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    );
  }

  /* ─── List View ─── */
  return (
    <>
      {deleteTarget && <DeleteConfirmation name={deleteTarget.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {pets.length === 0 ? (
          <div className="rounded-3xl bg-supet-bg-alt p-10 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/5" />
            <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-primary/5" />
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PawPrint className="h-9 w-9 text-primary/40" />
              </div>
              <p className="text-lg font-bold text-foreground">Nenhum pet cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                Cadastre seu pet para receber recomendações personalizadas de suplementos e cuidados.
              </p>
              <button onClick={handleAdd} className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Cadastrar meu pet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Pet count header */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {pets.length} pet{pets.length > 1 ? "s" : ""} cadastrado{pets.length > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                <PawPrint className="h-3 w-3" />
                <span>Clique para expandir detalhes</span>
              </div>
            </div>

            {pets.map((pet, i) => (
              <PetCard
                key={pet.id}
                pet={pet}
                index={i}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                calcAge={calcAge}
              />
            ))}

            <button onClick={handleAdd} className="w-full rounded-full border-2 border-dashed border-primary/30 py-3.5 text-sm font-bold text-primary hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group">
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" /> Adicionar outro pet
            </button>
          </>
        )}
      </motion.div>
    </>
  );
}
