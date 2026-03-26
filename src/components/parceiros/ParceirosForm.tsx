import { motion } from "framer-motion";
import { Handshake, Star, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";
import type { User } from "@supabase/supabase-js";

interface ParceirosFormProps {
  user: User | null;
  form: {
    name: string;
    email: string;
    instagram: string;
    channel_type: string;
    reason: string;
  };
  setForm: (form: ParceirosFormProps["form"]) => void;
  loading: boolean;
  submitted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const inputClass =
  "w-full rounded-2xl bg-background border border-border px-5 py-3.5 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

export default function ParceirosForm({ user, form, setForm, loading, submitted, onSubmit }: ParceirosFormProps) {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="rounded-3xl bg-secondary/60 p-8 md:p-10"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Candidatura Enviada!</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Analisaremos sua candidatura e entraremos em contato em breve.
              </p>
              {user && (
                <Link
                  to="/parceiros/painel"
                  className="inline-flex rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Ir para o Painel →
                </Link>
              )}
            </motion.div>
          ) : (
            <>
              <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Quero ser Parceiro
              </h2>

              {!user && (
                <div className="rounded-2xl bg-primary/5 p-4 mb-6 text-sm text-muted-foreground">
                  Você precisa estar{" "}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    logado
                  </Link>{" "}
                  para se candidatar.
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Nome completo
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    E-mail
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Instagram (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    className={inputClass}
                    placeholder="@seuinstagram"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Tipo de canal
                  </label>
                  <select
                    value={form.channel_type}
                    onChange={(e) => setForm({ ...form, channel_type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="influencer">Influenciador</option>
                    <option value="partner">Parceiro / Loja</option>
                    <option value="creator">Creator / Blog</option>
                    <option value="vet">Veterinário</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!user || loading}
                  className="w-full rounded-full bg-primary text-primary-foreground font-bold py-3.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.35)]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                  {loading ? "Enviando..." : "Enviar Candidatura"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
