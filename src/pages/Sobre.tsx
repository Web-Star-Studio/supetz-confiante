import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";

export default function Sobre() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-supetz-orange/10 -z-10" />
        <div className="absolute bottom-0 -left-32 h-48 w-48 rounded-full bg-supetz-orange/8 -z-10" />

        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-supetz-text leading-[1.1]"
          >
            Nossa Missão:{" "}
            <span className="text-supetz-orange">Saúde de Dentro para Fora</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-supetz-text/55 max-w-2xl mx-auto leading-relaxed"
          >
            Acreditamos que todo pet merece viver sem desconforto. Por isso, unimos ciência veterinária e ingredientes 100% naturais para criar algo que realmente funciona.
          </motion.p>
        </div>
      </section>

      {/* Ingredients */}
      <section className="py-20 bg-supetz-bg-alt">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl font-extrabold text-supetz-text">
                Ingredientes <span className="text-supetz-orange">100% Naturais</span>
              </h2>
              <p className="mt-4 text-supetz-text/55 leading-relaxed">
                Cada goma Supetz é feita com uma fórmula exclusiva que combina ômega 3, biotina, zinco, vitamina E e extratos vegetais cuidadosamente selecionados. Sem conservantes artificiais, sem químicos agressivos.
              </p>
              <p className="mt-4 text-supetz-text/55 leading-relaxed">
                Nossa fórmula age de dentro para fora, nutrindo a pele e fortalecendo a pelagem do seu pet de forma segura e eficaz.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative flex-1 flex items-center justify-center"
            >
              <div className="absolute -z-10 h-56 w-56 rounded-full bg-supetz-orange/80" />
              <div className="flex h-48 w-48 items-center justify-center">
                <span className="text-7xl">🌿</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Science */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col-reverse md:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative flex-1 flex items-center justify-center"
            >
              <div className="absolute -z-10 h-56 w-56 rounded-full bg-supetz-orange/15" />
              <div className="flex h-48 w-48 items-center justify-center">
                <span className="text-7xl">🔬</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl font-extrabold text-supetz-text">
                Ciência <span className="text-supetz-orange">Veterinária</span>
              </h2>
              <p className="mt-4 text-supetz-text/55 leading-relaxed">
                Desenvolvida em parceria com veterinários dermatologistas, a fórmula Supetz é baseada em estudos clínicos e testada rigorosamente para garantir segurança e eficácia.
              </p>
              <p className="mt-4 text-supetz-text/55 leading-relaxed">
                Cada ingrediente foi escolhido por sua comprovada capacidade de combater alergias cutâneas, fortalecer a imunidade e promover uma pelagem saudável e brilhante.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
