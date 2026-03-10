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
const benefitsListVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const benefitItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.durationFast,
      ease: motionTokens.easeOut,
    },
  },
};

export default function BenefitsSection() {
  return (
    <section id="beneficios-rapidos" className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="pointer-events-none absolute -top-20 left-0 h-96 w-96 rounded-full bg-supetz-orange/5 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-supetz-orange/5 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
            className="relative w-full max-w-md mx-auto lg:mx-0 overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black-[0.04]"
          >
            <img
              src="/images/lifestyle-dog.png"
              alt="Cachorro com pelagem saudável"
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-black/10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.1 }}
          >
            <h2 className="text-3xl font-extrabold leading-tight text-supetz-text md:text-4xl lg:text-5xl">
              Seu pet livre de coceiras, feridas e queda de pelos em poucas semanas
            </h2>
            <p className="mt-6 text-base leading-relaxed text-supetz-text/70 md:text-lg font-medium">
              Supet é um suplemento natural que ajuda a restaurar a saúde da pele do seu pet desde a raiz, combatendo alergias, coceiras e infecções de forma eficaz.
            </p>

            <div className="mt-10">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-supetz-orange">Benefícios rápidos</h3>
              <motion.ul
                variants={benefitsListVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.45 }}
                className="mt-6 grid gap-5 sm:grid-cols-2"
              >
                {quickBenefits.map((benefit) => (
                  <motion.li key={benefit} variants={benefitItemVariants} className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-supetz-orange/15 text-supetz-orange">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-supetz-text md:text-base leading-tight">
                      {benefit}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <MotionLink
              to="/shop"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-supetz-orange px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-supetz-orange-dark shadow-xl hover:shadow-2xl shadow-supetz-orange/25"
            >
              Comprar agora
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </MotionLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
