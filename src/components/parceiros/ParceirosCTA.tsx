import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

export default function ParceirosCTA() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="relative overflow-hidden rounded-3xl bg-secondary/60 p-8 md:p-14"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="md:max-w-lg">
              <span className="text-xs font-black uppercase tracking-[0.26em] text-primary">
                Junte-se a nós
              </span>
              <h2 className="mt-3 text-2xl md:text-4xl font-black text-foreground leading-tight">
                Transforme sua influência em renda
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
                Ganhe comissões divulgando produtos que realmente fazem diferença na saúde dos pets.
              </p>
            </div>

            <a
              href="#parceiros-form"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("[data-parceiros-form]")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:opacity-90 transition-opacity shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.35)]"
            >
              Quero ser parceiro
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
