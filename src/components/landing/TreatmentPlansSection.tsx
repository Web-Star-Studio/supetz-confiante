import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";

const plans = [
  {
    id: "plan-1",
    title: "1 mes de tratamento",
    description: "Ideal para iniciar o tratamento e avaliar os primeiros resultados.",
  },
  {
    id: "plan-2",
    title: "3 meses de tratamento",
    description: "O tratamento mais escolhido pelos tutores. Permite resultados mais consistentes na saude da pele.",
    badge: "Mais escolhido",
    highlighted: true,
  },
  {
    id: "plan-3",
    title: "6 meses de tratamento",
    description: "Tratamento completo recomendado para recuperacao total da pele e fortalecimento da imunidade.",
  },
];

const MotionLink = motion(Link);

export default function TreatmentPlansSection() {
  return (
    <section id="planos" className="relative overflow-hidden bg-supetz-bg py-20 md:py-24">
      <div className="pointer-events-none absolute right-0 top-6 h-56 w-56 rounded-full bg-supetz-orange/15 blur-3xl" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-black uppercase tracking-[0.26em] text-supetz-orange">Planos de tratamento</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-supetz-text md:text-5xl">
            Escolha o tratamento ideal para seu pet
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationBase, delay: index * 0.06, ease: motionTokens.easeOut }}
              className={`relative rounded-[2rem] p-7 md:p-8 ${
                plan.highlighted
                  ? "bg-supetz-orange text-white shadow-[0_26px_50px_-25px_rgba(255,122,0,0.75)]"
                  : "supet-soft-panel"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-supetz-orange">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-2xl font-extrabold leading-tight">{plan.title}</h3>
              <p className={`mt-4 text-sm leading-relaxed ${plan.highlighted ? "text-white/90" : "text-supetz-text/70"}`}>
                {plan.description}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <MotionLink
            to="/shop"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-supetz-orange px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-supetz-orange-dark"
          >
            Comprar agora
          </MotionLink>
        </div>
      </div>
    </section>
  );
}
