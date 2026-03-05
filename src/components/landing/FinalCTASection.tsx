import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";

const MotionLink = motion(Link);

export default function FinalCTASection() {
  return (
    <section id="garantia" className="relative overflow-hidden bg-supetz-bg py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="supet-soft-panel relative overflow-hidden p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-supetz-orange/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-supetz-orange/10 blur-2xl" />

          <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.26em] text-supetz-orange">Garantia</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-supetz-text md:text-5xl">
                Garantia de satisfacao
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-supetz-text/65 md:text-base">
                Voce pode testar Supet com tranquilidade. Se nao perceber melhorias, basta entrar em contato com o
                suporte dentro do prazo de garantia.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <MotionLink
                to="/shop"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-supetz-orange px-9 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-supetz-orange-dark"
              >
                Comprar agora
              </MotionLink>
              <p className="text-xs uppercase tracking-[0.18em] text-supetz-text/45">Suporte dedicado ao cliente</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
