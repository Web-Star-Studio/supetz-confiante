import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import PricingSection from "@/components/landing/PricingSection";
import { motionTokens } from "@/lib/motion";

const trustPoints = [
  "Frete para todo o Brasil",
  "Pagamento seguro",
  "Garantia de 30 dias",
];

export default function Shop() {
  return (
    <Layout>
      <section className="relative overflow-hidden pb-12 pt-16 md:pt-20">
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-supetz-orange/20 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-7 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            >
              <span className="text-xs font-black uppercase tracking-[0.26em] text-supetz-orange">Shop Supet</span>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight text-supetz-text md:text-6xl">
                Escolha o combo ideal para seu pet.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-supetz-text/65 md:text-base">
                Fórmulas naturais desenvolvidas para apoiar pele, pelagem e imunidade. Selecione o plano com melhor
                custo-benefício e comece hoje.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-supetz-orange/25 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-supetz-text/70"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
              className="supet-soft-panel p-4"
            >
              <img
                src="/images/product-gummy.png"
                alt="Pote Supet em destaque"
                className="h-[320px] w-full rounded-[1.5rem] object-cover md:h-[380px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <PricingSection />
    </Layout>
  );
}
