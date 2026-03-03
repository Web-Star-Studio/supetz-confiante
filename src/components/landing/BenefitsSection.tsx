import { motion } from "framer-motion";
import { benefits } from "@/services/mockData";

export default function BenefitsSection() {
  return (
    <section id="beneficios" className="relative py-20 md:py-28 bg-supetz-bg-alt">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-supetz-text">
            Por que os tutores <span className="text-supetz-orange">amam</span> Supetz?
          </h2>
          <p className="mt-4 text-supetz-text/50 max-w-lg mx-auto">
            Ingredientes naturais que fazem a diferença na vida do seu melhor amigo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-3xl bg-supetz-bg p-8 text-center"
            >
              <span className="text-4xl">{benefit.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-supetz-text">{benefit.title}</h3>
              <p className="mt-2 text-sm text-supetz-text/55 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
