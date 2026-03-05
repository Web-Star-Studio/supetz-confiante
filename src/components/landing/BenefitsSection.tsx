import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";

const quickBenefits = [
  "Alivia coceiras intensas",
  "Reduz queda de pelos",
  "Fortalece a pele e a imunidade",
  "Fórmula 100% natural",
];

const MotionLink = motion(Link);

export default function BenefitsSection() {
  return (
    <section id="beneficios-rapidos" className="relative overflow-hidden bg-supetz-bg-alt py-20 md:py-24">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-supetz-orange/15 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="supet-soft-panel relative overflow-hidden p-8 md:p-12"
        >
          <img
            src="/images/lifestyle-dog.png"
            alt="Cachorro com pelagem saudável"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
            loading="lazy"
          />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-supetz-text md:text-5xl">
                Seu pet livre de coceiras, feridas e queda de pelos em poucas semanas
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-supetz-text/70 md:text-base">
                Supet e um suplemento natural que ajuda a restaurar a saude da pele do seu pet desde a raiz,
                combatendo alergias, coceiras e infeccoes de forma eficaz.
              </p>
            </div>

            <div className="rounded-3xl border border-supetz-orange/20 bg-white/90 p-6 md:p-7">
              <h3 className="text-lg font-extrabold uppercase tracking-[0.14em] text-supetz-orange">Beneficios rapidos</h3>
              <ul className="mt-5 space-y-3">
                {quickBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm font-semibold text-supetz-text md:text-base">
                    <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-supetz-orange" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <MotionLink
                to="/shop"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="mt-7 inline-flex rounded-full bg-supetz-orange px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-supetz-orange-dark"
              >
                Comprar agora
              </MotionLink>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
