import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const steps = [
  { step: "1", title: "Cadastre-se", desc: "Preencha o formulário abaixo com seus dados." },
  { step: "2", title: "Aprovação", desc: "Nossa equipe analisa e aprova sua candidatura." },
  { step: "3", title: "Compartilhe", desc: "Receba seu cupom e link exclusivo para divulgar." },
  { step: "4", title: "Ganhe", desc: "Acompanhe vendas e solicite saques pelo painel." },
];

export default function ParceirosTimeline() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
          className="text-xs font-black uppercase tracking-[0.26em] text-primary text-center mb-12"
        >
          Como funciona
        </motion.h2>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:grid grid-cols-4 gap-0 relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-[12.5%] right-[12.5%] h-px bg-border" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm mb-5">
                {s.step}
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
              className="flex items-start gap-5 py-5"
            >
              <div className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
                {s.step}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
