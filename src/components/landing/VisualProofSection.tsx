import { useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const headlineLines = ["Veja a", "transformacao", "de milhares", "de pets"];

export default function VisualProofSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const collageY = useTransform(scrollYProgress, [0, 1], [26, -24]);
  const collageRotate = useTransform(scrollYProgress, [0, 1], [-1.2, 1.2]);

  const collageStyle = useMemo(
    () => (reduceMotion ? undefined : { y: collageY, rotate: collageRotate }),
    [reduceMotion, collageY, collageRotate],
  );

  return (
    <section ref={sectionRef} id="antes-e-depois" className="relative overflow-hidden bg-supet-bg py-16 md:py-20">
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, 14, 0], y: [0, -10, 0], scale: [1, 1.05, 1] }}
        transition={reduceMotion ? undefined : { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-12 top-20 h-36 w-36 rounded-full bg-supet-orange/12 blur-2xl"
      />
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, 8, 0], scale: [1, 1.08, 1] }}
        transition={reduceMotion ? undefined : { duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.4 }}
        className="pointer-events-none absolute right-[-40px] top-24 h-32 w-32 rounded-full bg-[#f3aa2f]/15 blur-2xl"
      />

      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            className="min-w-0 lg:pr-6"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
              className="inline-block text-xs font-black uppercase tracking-[0.26em] text-supet-orange"
            >
              Prova visual
            </motion.span>

            <motion.h2
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.08,
                  },
                },
              }}
              className="mt-4 max-w-[11ch] font-display text-[clamp(2.6rem,6.8vw,6.4rem)] font-extrabold uppercase leading-[0.83] tracking-[-0.035em] text-supet-orange"
            >
              {headlineLines.map((line) => (
                <motion.span
                  key={line}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: motionTokens.durationBase, ease: motionTokens.easeOut },
                    },
                  }}
                  className="block"
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: motionTokens.durationBase, ease: motionTokens.easeOut },
                  },
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        filter: ["saturate(1)", "saturate(1.08)", "saturate(1)"],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 4.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                }
                className="mt-1 block text-[#f3aa2f]"
              >
                em poucas semanas
              </motion.span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationBase, delay: 0.2, ease: motionTokens.easeOut }}
              className="mt-6 max-w-xl text-sm leading-relaxed text-supet-text/70 md:text-base"
            >
              Apos algumas semanas de uso do Supet, e possivel notar mudancas visiveis na saude da pele e da pelagem
              do seu pet.
            </motion.p>
          </motion.div>

          <motion.div
            style={collageStyle}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: motionTokens.durationBase, delay: 0.06, ease: motionTokens.easeOut }}
            className="relative mx-auto h-[460px] w-full max-w-[320px] sm:h-[520px] sm:max-w-[350px] lg:mx-0 lg:h-[560px] lg:max-w-[370px]"
          >
            <motion.article
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -7, 0],
                      rotate: [0, 0.5, 0],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 7.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
              className="absolute right-0 top-0 h-[72%] w-[62%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_24px_44px_-24px_rgba(34,20,9,0.7)]"
            >
              <motion.img
                src="/images/pet-badboy.png"
                alt="Pet estiloso e saudavel"
                animate={reduceMotion ? undefined : { scale: [1, 1.045, 1] }}
                transition={reduceMotion ? undefined : { duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="h-full w-full object-cover object-[56%_32%]"
              />
            </motion.article>

            <motion.article
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, 5, 0],
                      rotate: [0, -0.4, 0],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 8.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }
              }
              className="absolute bottom-0 right-0 h-[24%] w-[62%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_24px_44px_-24px_rgba(34,20,9,0.7)]"
            >
              <motion.img
                src="/images/pet-fashion.png"
                alt="Detalhe da pelagem do pet"
                animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
                transition={reduceMotion ? undefined : { duration: 8.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="h-full w-full object-cover object-[50%_26%]"
              />
            </motion.article>

            <motion.article
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -6, 0],
                      rotate: [0, -0.5, 0],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 8.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }
              }
              className="absolute bottom-[13%] left-0 h-[50%] w-[70%] overflow-hidden rounded-2xl border-4 border-black/95 bg-black shadow-[0_30px_52px_-22px_rgba(0,0,0,0.8)] lg:left-[-10%]"
            >
              <motion.img
                src="/images/pet-winter.png"
                alt="Pet ativo e confortavel"
                animate={reduceMotion ? undefined : { scale: [1, 1.05, 1], x: [0, 2, 0] }}
                transition={reduceMotion ? undefined : { duration: 9.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="h-full w-full object-cover object-[50%_40%] saturate-[1.05] brightness-[0.88]"
              />
            </motion.article>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
