import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Sparkles, Heart, Shield, Award, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { motionTokens } from "@/lib/motion";
import AnimatedSectionHeading from "@/components/landing/AnimatedSectionHeading";

const actionSteps = [
  {
    step: "01",
    title: "Base intestinal",
    text: "Nutre a base intestinal e imunologica para reduzir gatilhos.",
    tone: "bg-[#fff4e8] border-supet-orange/25",
  },
  {
    step: "02",
    title: "Controle de inflamacao",
    text: "Reduz irritacoes recorrentes e melhora o conforto da pele.",
    tone: "bg-white border-supet-text/15",
  },
  {
    step: "03",
    title: "Reconstrucao da pele",
    text: "Reforca a barreira cutanea e fortalece a pelagem.",
    tone: "bg-[#fff9f2] border-supet-orange/25",
  },
];

const ingredients = [
  {
    title: "Tripla absorcao nutricional",
    description: "Maior eficiencia na absorcao dos nutrientes.",
    tag: "Absorcao",
    position: "left-[7%] top-[8%]",
    orbitX: -314,
    orbitY: -220,
    connectX: -275, connectY: -219, startX: -70, startY: -62,
  },
  {
    title: "Colageno tipo 2",
    description: "Ajuda na reconstrucao da pele e da pelagem.",
    tag: "Estrutura",
    position: "right-[7%] top-[10%]",
    orbitX: 316,
    orbitY: -206,
    connectX: 275, connectY: -206, startX: 65, startY: -60,
  },
  {
    title: "Biotina",
    description: "Fortalece os pelos e recupera a barreira da pele.",
    tag: "Pelagem",
    position: "left-[2%] top-[39%]",
    orbitX: -364,
    orbitY: -12,
    connectX: -333, connectY: -20, startX: -97, startY: -2,
  },
  {
    title: "Vitamina E",
    description: "Auxilia na regeneracao celular e reduz inflamacoes.",
    tag: "Reparo",
    position: "right-[4%] top-[41%]",
    orbitX: 366,
    orbitY: -4,
    connectX: 310, connectY: -8, startX: 91, startY: -2,
  },
  {
    title: "Probioticos",
    description: "Equilibram a saude intestinal e fortalecem a imunidade.",
    tag: "Imunidade",
    position: "left-[12%] bottom-[9%]",
    orbitX: -262,
    orbitY: 214,
    connectX: -218, connectY: 212, startX: -70, startY: 56,
  },
  {
    title: "Sabor irresistivel",
    description: "Facilita a aceitacao do pet no dia a dia.",
    tag: "Aceitacao",
    position: "right-[12%] bottom-[8%]",
    orbitX: 264,
    orbitY: 220,
    connectX: 218, connectY: 219, startX: 65, startY: 57,
  },
];

const dailyBenefits = [
  {
    icon: Sparkles,
    title: "Alivio das coceiras",
    description: "Resultados visiveis em poucos dias de uso",
  },
  {
    icon: Heart,
    title: "Pelagem bonita e saudavel",
    description: "Pelos mais fortes e brilhantes",
  },
  {
    icon: Shield,
    title: "Imunidade fortalecida",
    description: "Organismo mais resistente e protegido",
  },
  {
    icon: Award,
    title: "Pele resistente",
    description: "Protecao contra alergias e irritacoes",
  },
  {
    icon: Leaf,
    title: "Formula natural",
    description: "Sem dependencia quimica ou efeitos colaterais",
  },
];

type Ingredient = (typeof ingredients)[number];

// Motion Video Component for Daily Benefits
function DailyBenefitsMotionVideo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dailyBenefits.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isInView]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + dailyBenefits.length) % dailyBenefits.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % dailyBenefits.length);
  };

  const currentBenefit = dailyBenefits[currentIndex];
  const Icon = currentBenefit.icon;

  return (
    <div ref={sectionRef} className="mt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: motionTokens.easeOut }}
        className="text-center"
      >
        <AnimatedSectionHeading
          as="h3"
          lines={["O que acontece quando", "seu pet usa Supet diariamente"]}
          accentLines={[1]}
          lineLayout="stacked"
          align="center"
          size="lg"
        />
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-supet-text/70 md:text-base">
          Beneficios progressivos que melhoram a qualidade de vida do seu pet
        </p>
      </motion.div>

      {/* Motion Video Container */}
      <div className="relative mx-auto mt-12 max-w-4xl">
        {/* Video-Style Display */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-supet-bg to-white p-5 shadow-2xl md:p-6">
          {/* Navigation Arrows - Minimalist design */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-supet-orange/20 focus:ring-offset-2"
            aria-label="Benefício anterior"
          >
            <ChevronLeft className="h-8 w-8 text-supet-orange/60 transition-colors hover:text-supet-orange" strokeWidth={2.5} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-supet-orange/20 focus:ring-offset-2"
            aria-label="Próximo benefício"
          >
            <ChevronRight className="h-8 w-8 text-supet-orange/60 transition-colors hover:text-supet-orange" strokeWidth={2.5} />
          </button>

          {/* Animated background orbs */}
          <motion.div
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-supet-orange/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-supet-orange/8 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Content with slide transitions */}
          <div className="relative z-10 flex min-h-[240px] flex-col px-12 py-6 md:px-16 md:py-8">
            {/* Main content area - centered with more space */}
            <div className="flex flex-1 items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.6,
                    ease: motionTokens.easeOut,
                  }}
                  className="flex w-full max-w-3xl items-center justify-center"
                >
                  {/* Main content row */}
                  <div className="flex w-full flex-col items-center justify-center gap-5 text-center md:flex-row md:gap-8 md:text-left">
                    {/* Animated Icon */}
                    <motion.div
                      className="relative shrink-0"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.div
                        animate={{
                          rotate: [0, -5, 5, -5, 5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative"
                      >
                        {/* Icon with orange gradient */}
                        <div className="relative rounded-[1.5rem] bg-gradient-to-br from-supet-orange to-orange-600 p-6 shadow-2xl md:p-7">
                          <Icon className="h-14 w-14 text-white md:h-16 md:w-16" strokeWidth={2} />

                          {/* Pulsing glow */}
                          <motion.div
                            className="absolute -inset-3 -z-10 rounded-[1.5rem] bg-gradient-to-br from-supet-orange to-orange-600 blur-2xl"
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                              scale: [0.9, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex-1 space-y-2.5">
                      <motion.h4
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-balance text-2xl font-black leading-tight text-supet-text md:text-3xl lg:text-4xl"
                      >
                        {currentBenefit.title}
                      </motion.h4>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-balance text-base leading-relaxed text-supet-text/70 md:text-lg"
                      >
                        {currentBenefit.description}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots - positioned at bottom with more spacing */}
            <div className="flex items-center justify-center gap-2 pb-2 pt-6">
              {dailyBenefits.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scale: currentIndex === idx ? 1 : 0.7,
                    opacity: currentIndex === idx ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      currentIndex === idx
                        ? "bg-supet-orange"
                        : "bg-supet-text/30"
                    }`}
                  />
                  {currentIndex === idx && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-supet-orange"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 text-center text-sm text-supet-text/60"
        >
          Resultados podem variar • Uso continuo recomendado para melhores resultados
        </motion.p>
      </div>
    </div>
  );
}

function ConnectionLine({
  connectX,
  connectY,
  startX,
  startY,
  index,
  active,
}: {
  connectX: number;
  connectY: number;
  startX: number;
  startY: number;
  index: number;
  active: boolean;
}) {
  const r = 14;
  const isHorizontal = Math.abs(connectY - startY) < 25;

  let d: string;

  if (isHorizontal) {
    // Middle cards: straight horizontal from bone side to card
    d = `M ${startX} ${startY} H ${connectX}`;
  } else {
    // Top/bottom cards: vertical-first from bone surface, then horizontal to card
    const isLeft = connectX < 0;
    const goingUp = connectY < startY;
    // Go vertical first, stop short of connectY by radius for the arc
    const vStopY = goingUp ? connectY + r : connectY - r;
    // Arc turns toward the card horizontally
    const arcEndX = isLeft ? startX - r : startX + r;
    const sweep = (isLeft && goingUp) || (!isLeft && !goingUp) ? 0 : 1;

    d = `M ${startX} ${startY} V ${vStopY} A ${r} ${r} 0 0 ${sweep} ${arcEndX} ${connectY} H ${connectX}`;
  }

  const delay = index * 0.08;

  return (
    <>
      {/* Start dot on bone surface */}
      <motion.circle
        cx={startX}
        cy={startY}
        r={3}
        fill="#FF914D"
        initial={{ scale: 0, opacity: 0 }}
        animate={active ? { scale: 1, opacity: 0.55 } : { scale: 0, opacity: 0 }}
        transition={{ delay, duration: 0.2 }}
      />
      {/* L-shaped path */}
      <motion.path
        d={d}
        fill="none"
        stroke="#FF914D"
        strokeWidth={1.5}
        strokeOpacity={0.35}
        strokeLinecap="round"
        strokeDasharray="6 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{
          pathLength: { duration: 0.7, delay, ease: motionTokens.easeOut },
          opacity: { duration: 0.15, delay },
        }}
      />
      {/* End dot at card */}
      <motion.circle
        cx={connectX}
        cy={connectY}
        r={3}
        fill="#FF914D"
        initial={{ scale: 0, opacity: 0 }}
        animate={active ? { scale: 1, opacity: 0.55 } : { scale: 0, opacity: 0 }}
        transition={{
          delay: delay + 0.7,
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      />
    </>
  );
}

function rotatePoint(x: number, y: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function IngredientOrbitCard({
  item,
  index,
  orbitActive,
  orbitSweep,
}: {
  item: Ingredient;
  index: number;
  orbitActive: boolean;
  orbitSweep: number;
}) {
  const progress = useMotionValue(orbitActive ? 1 : 0);

  useEffect(() => {
    if (!orbitActive) return;

    const controls = animate(progress, 1, {
      duration: 0.92 + index * 0.05,
      delay: 0.03 + index * 0.04,
      ease: motionTokens.easeOut,
    });

    return () => controls.stop();
  }, [index, orbitActive, progress]);

  const opacity = useTransform(progress, [0, 0.1, 1], [0, 1, 1]);
  const scale = useTransform(progress, [0, 0.78, 1], [0.9, 1.02, 1]);
  const rotate = useTransform(progress, [0, 1], [-4.5, 0]);
  const blur = useTransform(progress, [0, 1], [10, 0]);
  const saturate = useTransform(progress, [0, 1], [0.88, 1]);
  const shadowY = useTransform(progress, [0, 1], [28, 16]);
  const shadowBlur = useTransform(progress, [0, 1], [40, 34]);
  const shadowOpacity = useTransform(progress, [0, 1], [0.18, 0.52]);
  const filter = useMotionTemplate`blur(${blur}px) saturate(${saturate})`;
  const boxShadow = useMotionTemplate`0 ${shadowY}px ${shadowBlur}px -24px rgba(55,35,10,${shadowOpacity})`;
  const x = useTransform(progress, (latest) => {
    const currentAngle = -orbitSweep * (1 - latest);
    const radiusScale = 1 + (1 - latest) * 0.045;
    const currentPoint = rotatePoint(item.orbitX * radiusScale, item.orbitY * radiusScale, currentAngle);

    return currentPoint.x - item.orbitX;
  });
  const y = useTransform(progress, (latest) => {
    const currentAngle = -orbitSweep * (1 - latest);
    const radiusScale = 1 + (1 - latest) * 0.045;
    const currentPoint = rotatePoint(item.orbitX * radiusScale, item.orbitY * radiusScale, currentAngle);

    return currentPoint.y - item.orbitY;
  });

  return (
    <motion.article
      style={{ opacity, scale, rotate, x, y, filter, boxShadow, willChange: "transform, opacity, filter" }}
      className={`absolute w-[220px] rounded-[1.3rem_1.8rem_1.4rem_1.6rem] border border-supet-orange/20 bg-white/95 p-4 shadow-[0_16px_34px_-24px_rgba(55,35,10,0.52)] ${item.position}`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supet-orange">{item.tag}</p>
      <p className="mt-1 text-lg font-extrabold leading-tight text-supet-text">{item.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-supet-text/70">{item.description}</p>
    </motion.article>
  );
}

export default function NaturalTreatmentSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbitActive = useInView(sectionRef, { once: true, amount: 0.16 });
  const orbitSweep = 26;
  const [linesActive, setLinesActive] = useState(false);

  useEffect(() => {
    if (!orbitActive) return;
    const timer = setTimeout(() => setLinesActive(true), 1500);
    return () => clearTimeout(timer);
  }, [orbitActive]);

  return (
    <section ref={sectionRef} id="tratamento-natural" className="relative overflow-hidden bg-supet-bg py-20 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-supet-orange/14 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full bg-supet-orange/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <AnimatedSectionHeading
            eyebrow="Tratamento natural Supet"
            lines={["Conheca o tratamento", "natural Supet"]}
            accentLines={[1]}
            lineLayout="stacked"
            align="center"
            size="lg"
            className="mx-auto max-w-[36rem]"
          />
          <p className="mt-4 text-sm leading-relaxed text-supet-text/70 md:text-base">
            Supet foi desenvolvido com uma combinacao de nutrientes essenciais que ajudam a restaurar a saude da pele
            e fortalecer o organismo do pet.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {actionSteps.map((item, index) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationFast, delay: index * 0.08, ease: motionTokens.easeOut }}
              className={`relative rounded-[1.4rem_1rem_1.6rem_1.1rem] border p-4 text-left shadow-[0_16px_30px_-24px_rgba(55,35,10,0.52)] ${item.tone}`}
            >
              <span className="mb-2 inline-flex rounded-full bg-supet-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                Etapa {item.step}
              </span>
              <p className="text-sm font-extrabold text-supet-text">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-supet-text/75">{item.text}</p>
            </motion.article>
          ))}
        </div>

        <div className="relative mt-12 hidden h-[640px] lg:block">
          <motion.div
            style={{ x: "-50%", y: "-50%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              orbitActive
                ? {
                    scale: 1,
                    opacity: 1,
                    y: ["-50%", "-51.5%", "-50%"],
                    rotate: [0, 0.5, 0],
                  }
                : { scale: 0, opacity: 0 }
            }
            transition={
              orbitActive
                ? {
                    scale: { type: "spring", stiffness: 260, damping: 14, mass: 0.8 },
                    opacity: { duration: 0.3 },
                    y: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.8 },
                    rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.8 },
                  }
                : {}
            }
            className="absolute left-1/2 top-1/2 z-10 flex items-center justify-center"
          >
            <img
              src="/images/supet-logo.png"
              alt="Gummy Supet"
              className="h-[400px] w-[400px] object-contain drop-shadow-[0_16px_40px_rgba(255,122,0,0.35)]"
            />
          </motion.div>

          {/* Connection lines SVG overlay */}
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="900"
            height="640"
            viewBox="-450 -320 900 640"
            style={{ overflow: "visible" }}
          >
            {ingredients.map((item, index) => (
              <ConnectionLine
                key={item.title}
                connectX={item.connectX}
                connectY={item.connectY}
                startX={item.startX}
                startY={item.startY}
                index={index}
                active={linesActive}
              />
            ))}
          </svg>

          {ingredients.map((item, index) => (
            <IngredientOrbitCard
              key={item.title}
              item={item}
              index={index}
              orbitActive={orbitActive}
              orbitSweep={orbitSweep}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-2 lg:hidden">
          {ingredients.map((item) => (
            <div key={item.title} className="border-l-4 border-supet-orange/60 bg-white/75 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supet-orange">{item.tag}</p>
              <p className="text-lg font-extrabold text-supet-text">{item.title}</p>
              <p className="text-sm leading-relaxed text-supet-text/72">{item.description}</p>
            </div>
          ))}
        </div>

        <DailyBenefitsMotionVideo />
      </div>
    </section>
  );
}
