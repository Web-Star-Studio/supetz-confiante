import { motion } from "framer-motion";
import { Clock3, MessageCircleMore } from "lucide-react";
import FAQSection from "@/components/landing/FAQSection";
import { motionTokens } from "@/lib/motion";
import AnimatedSectionHeading from "@/components/landing/AnimatedSectionHeading";

export default function FAQStandaloneSection() {
  return (
    <section className="relative bg-supetz-bg py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <AnimatedSectionHeading
            eyebrow="Perguntas frequentes"
            lines={["Tire suas", "duvidas", "antes de comprar"]}
            accentLines={[2]}
            lineLayout="alternate"
            align="center"
            size="lg"
          />
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-supetz-orange/20 bg-white/75 p-4">
            <div className="flex items-center gap-2 text-supetz-orange">
              <Clock3 className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.12em]">Resposta rapida</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-supetz-text/75">Informacoes claras para decidir com seguranca.</p>
          </div>
          <div className="rounded-2xl border border-supetz-orange/20 bg-white/75 p-4">
            <div className="flex items-center gap-2 text-supetz-orange">
              <MessageCircleMore className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.12em]">Suporte humano</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-supetz-text/75">Caso precise, nosso atendimento ajuda voce.</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
        >
          <FAQSection />
        </motion.div>
      </div>
    </section>
  );
}
