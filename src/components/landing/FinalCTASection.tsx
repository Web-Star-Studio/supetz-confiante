import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";

const MotionLink = motion(Link);

export default function FinalCTASection() {
  return (
    <section id="garantia" className="relative overflow-hidden bg-supet-bg py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="supet-soft-panel relative overflow-hidden p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-supet-orange/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-supet-orange/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="md:max-w-xl">
              <span className="text-xs font-black uppercase tracking-[0.26em] text-supet-orange">Garantia</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-supet-text md:text-5xl text-balance">
                Garantia de satisfacao
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-supet-text/65 md:text-base">
                Voce pode testar Supet com tranquilidade. Se nao perceber melhorias, basta entrar em contato com o
                suporte dentro do prazo de garantia.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center gap-4">
              <MotionLink
                to="/shop"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-full text-center rounded-full bg-supet-orange px-10 py-4 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:bg-supet-orange-dark hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_30px_-6px_rgba(255,107,43,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(255,107,43,0.6)]"
              >
                Comprar agora
              </MotionLink>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-supet-text/50 text-center">Suporte dedicado ao cliente</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
