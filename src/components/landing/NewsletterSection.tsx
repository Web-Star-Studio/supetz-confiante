import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motionTokens } from "@/lib/motion";

const ease = motionTokens.easeOut as [number, number, number, number];

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .insert({ email: trimmed, source: "landing" } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("Você já está inscrito na nossa newsletter! 🎉");
        setSubscribed(true);
      } else {
        toast.error("Erro ao se inscrever. Tente novamente.");
      }
    } else {
      toast.success("Inscrição confirmada! 🎉");
      setSubscribed(true);
    }
    setLoading(false);
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease }}
          className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-secondary to-primary/5 p-8 md:p-12 text-center overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
              <Mail className="w-6 h-6 text-primary" />
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Dicas de saúde pet no seu e-mail
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-8">
              Receba conteúdos exclusivos sobre cuidados com a pele e pelagem do seu cão, além de ofertas especiais.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 text-primary font-bold"
              >
                <CheckCircle className="w-5 h-5" />
                Você está inscrito!
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  required
                  className="flex-1 px-5 py-3.5 rounded-full bg-background border border-border/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? "..." : <>Inscrever <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
