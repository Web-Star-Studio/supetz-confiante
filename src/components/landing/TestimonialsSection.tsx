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
      <div className="mb-8 flex flex-col gap-6 justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-supet-text md:text-4xl text-balance leading-tight">O que os tutores estão dizendo</h2>
          <p className="mt-3 text-[0.95rem] text-supet-text/70 leading-relaxed max-w-md">
            Centenas de tutores relatam melhora significativa nos sintomas após o uso contínuo do Supet.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={active.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
          className="w-full flex cursor-pointer sm:cursor-auto"
          onClick={goToNext}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={active.image}
              alt={`Foto de ${active.petName}`}
              className="h-48 w-full rounded-2xl object-cover shrink-0 sm:h-32 sm:w-32"
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
          Redução das coceiras
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
