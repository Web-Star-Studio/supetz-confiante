import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { testimonials } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";
import type { Testimonial } from "@/types";

const AUTOPLAY_INTERVAL = 4800;

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: motionTokens.easeOut }}
      className="group relative overflow-hidden rounded-[1.6rem_2rem_1.4rem_1.8rem] border border-supet-text/10 bg-white shadow-[0_16px_34px_-24px_rgba(55,35,10,0.32)] transition-all duration-500 hover:border-supet-orange/20 hover:shadow-[0_20px_40px_-20px_rgba(255,107,43,0.15)]"
    >
      <img
        src={testimonial.image}
        alt={`${testimonial.tutorName} com ${testimonial.petName}`}
        className="h-52 w-full object-cover"
      />

      <div className="relative p-6">
        {/* Decorative quote mark */}
        <div className="pointer-events-none absolute -right-1 -top-8 select-none text-[10rem] font-black leading-none text-supet-orange/[0.06]">
          &ldquo;
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-1 text-supet-orange">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>

          <p className="mt-3 text-[1.05rem] leading-relaxed text-supet-text/80">
            &ldquo;{testimonial.quote}&rdquo;
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-supet-orange/20">
              <img
                src={testimonial.image}
                alt={testimonial.tutorName}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-supet-text">{testimonial.tutorName}</p>
              <p className="text-xs text-supet-text/55">tutor(a) de {testimonial.petName}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

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

  const active = testimonials[activeIndex];

  return (
    <div id="depoimentos">
      {/* Section heading */}
      <div className="mb-10 lg:mb-12">
        <h2 className="text-3xl font-extrabold text-supet-text md:text-4xl lg:text-5xl text-balance leading-tight">
          O que os tutores estão dizendo
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] text-supet-text/70 leading-relaxed">
          Centenas de tutores relatam melhora significativa nos sintomas após o uso contínuo do Supet.
        </p>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {testimonials.map((t, i) => (
          <TestimonialCard key={t.id} testimonial={t} index={i} />
        ))}
      </div>

      {/* Mobile/Tablet: carousel in soft panel */}
      <div
        className="supet-soft-panel p-7 lg:hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
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
                <p className="text-sm leading-relaxed text-supet-text/75 md:text-[15px]">&ldquo;{active.quote}&rdquo;</p>
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
      </div>

      {/* Stat pills */}
      <div className="mt-8 grid gap-2 sm:grid-cols-3 lg:mt-10">
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
