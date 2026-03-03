import { motion } from "framer-motion";
import RemotionPlaceholder from "@/components/remotion-assets/RemotionPlaceholder";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col-reverse md:flex-row md:items-center md:gap-16">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1 mt-12 md:mt-0"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-supetz-text">
              Seu pet livre de{" "}
              <span className="text-supetz-orange">coceiras e feridas</span>{" "}
              em 30 dias
            </h1>
            <p className="mt-6 max-w-md text-lg text-supetz-text/60 leading-relaxed">
              Gomas 100% naturais desenvolvidas por veterinários. Resultados visíveis já na primeira semana.
            </p>
            <motion.a
              href="#precos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 inline-block rounded-full bg-supetz-orange px-10 py-4 text-base font-bold text-white transition-colors hover:bg-supetz-orange-dark"
            >
              COMPRAR AGORA
            </motion.a>
          </motion.div>

          {/* Right — Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative flex-1 flex items-center justify-center"
          >
            {/* Giant orange circle */}
            <div className="absolute -z-10 h-72 w-72 md:h-96 md:w-96 rounded-full bg-supetz-orange/90" />
            
            {/* Dog placeholder */}
            <div className="relative z-10 flex h-64 w-64 md:h-80 md:w-80 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-6xl">🐕</span>
                <span className="text-sm font-semibold text-white/90">Imagem do Pet</span>
              </div>
            </div>

            {/* Small floating dots */}
            <div className="absolute -top-4 right-4 h-5 w-5 rounded-full bg-supetz-orange/50 animate-float" />
            <div className="absolute bottom-8 -left-6 h-3 w-3 rounded-full bg-supetz-orange/40 animate-float-slow" />
          </motion.div>
        </div>

        {/* Remotion placeholder */}
        <div className="mt-16">
          <RemotionPlaceholder />
        </div>
      </div>
    </section>
  );
}
