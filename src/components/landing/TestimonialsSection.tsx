import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { testimonials } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";

const AUTOPLAY_INTERVAL = 4800;

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(id);
  }, [isPaused]);

  const goToNext = () => setActiveIndex((current) => (current + 1) % testimonials.length);
  const goToPrev = () => {
    setActiveIndex((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const active = testimonials[activeIndex];

  return (
    <div
      id="depoimentos"
      className="supet-soft-panel h-full p-7 md:p-9"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="mb-8 flex items-center justify-between gap-5">
        <div>
          <h2 className="text-3xl font-extrabold text-supet-text md:text-4xl text-balance">O que os tutores estao dizendo</h2>
          <p className="mt-2 text-sm text-supet-text/60">
            Centenas de tutores relatam melhora significativa nos sintomas apos o uso continuo do Supet.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goToPrev}
            className="rounded-full border border-supet-text/15 bg-white/85 p-2 text-supet-text transition-colors hover:border-supet-orange hover:text-supet-orange"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="rounded-full border border-supet-text/15 bg-white/85 p-2 text-supet-text transition-colors hover:border-supet-orange hover:text-supet-orange"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={active.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
          className="rounded-[2rem] border border-supet-orange/15 bg-white p-4 md:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={active.image}
              alt={`Foto de ${active.petName}`}
              className="h-28 w-full rounded-2xl object-cover sm:h-28 sm:w-28"
            />

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-1 text-supet-orange">
                {Array.from({ length: active.rating }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-supet-text/75 md:text-[15px]">"{active.quote}"</p>
              <p className="mt-3 text-sm font-bold text-supet-text">
                {active.tutorName}
                <span className="font-medium text-supet-text/60"> · tutor(a) de {active.petName}</span>
              </p>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-supet-orange" : "w-2.5 bg-supet-orange/30 hover:bg-supet-orange/60"
            }`}
            aria-label={`Ir para depoimento ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <p className="rounded-full border border-supet-orange/20 bg-supet-orange/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-supet-text/70">
          Reducao das coceiras
        </p>
        <p className="rounded-full border border-supet-orange/20 bg-supet-orange/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-supet-text/70">
          Menos queda de pelos
        </p>
        <p className="rounded-full border border-supet-orange/20 bg-supet-orange/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-supet-text/70">
          Pets mais ativos
        </p>
      </div>
    </div>
  );
}
