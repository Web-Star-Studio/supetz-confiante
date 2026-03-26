import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export default function ParceirosHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
      {/* Decorative orange circle */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-[280px] w-[280px] rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary mb-8">
            <Handshake className="w-4 h-4" /> Programa de Parceiros
          </span>

          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-[1.1] mb-6">
            Indique a Supet e{" "}
            <span className="text-primary">ganhe comissões</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Seja um parceiro, influenciador ou creator. Compartilhe seu link exclusivo,
            ofereça desconto aos seus seguidores e ganhe comissão em cada venda.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
