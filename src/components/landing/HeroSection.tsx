import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { motionTokens } from "@/lib/motion";

const GUMMY_BONES = [
  // Cluster below the lid / above the jar — large
  { left: "38%", top: "22%", size: 180, rotate: -30, delay: 0.1 },
  { left: "52%", top: "16%", size: 200, rotate: 20, delay: 0.15 },
  { left: "32%", top: "32%", size: 160, rotate: 55, delay: 0.18 },
  { left: "58%", top: "28%", size: 170, rotate: -50, delay: 0.12 },
  { left: "44%", top: "12%", size: 190, rotate: -15, delay: 0.08 },
  { left: "64%", top: "36%", size: 150, rotate: 35, delay: 0.22 },
  { left: "26%", top: "16%", size: 165, rotate: 40, delay: 0.14 },
  { left: "48%", top: "30%", size: 140, rotate: -65, delay: 0.2 },
  { left: "36%", top: "42%", size: 155, rotate: 10, delay: 0.17 },
  // Extra cluster between SEU and PET
  { left: "42%", top: "14%", size: 160, rotate: 25, delay: 0.09 },
  { left: "50%", top: "20%", size: 175, rotate: -35, delay: 0.11 },
  { left: "46%", top: "26%", size: 145, rotate: 50, delay: 0.13 },
  { left: "54%", top: "12%", size: 155, rotate: -10, delay: 0.07 },
  { left: "40%", top: "18%", size: 135, rotate: 60, delay: 0.16 },
  // Scattered to edges — medium to large
  { left: "4%", top: "24%", size: 140, rotate: -20, delay: 0.2 },
  { left: "90%", top: "20%", size: 155, rotate: 45, delay: 0.25 },
  { left: "8%", top: "52%", size: 130, rotate: -60, delay: 0.28 },
  { left: "88%", top: "56%", size: 135, rotate: 25, delay: 0.3 },
  { left: "2%", top: "72%", size: 120, rotate: 10, delay: 0.32 },
  { left: "93%", top: "42%", size: 125, rotate: -40, delay: 0.26 },
  { left: "16%", top: "40%", size: 145, rotate: 70, delay: 0.16 },
  { left: "78%", top: "14%", size: 130, rotate: -25, delay: 0.19 },
  { left: "12%", top: "68%", size: 110, rotate: 50, delay: 0.34 },
  { left: "84%", top: "68%", size: 105, rotate: -10, delay: 0.36 },
  { left: "22%", top: "60%", size: 125, rotate: -45, delay: 0.24 },
];

type HeroParallaxLayerProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  pointerX?: MotionValue<number>;
  pointerY?: MotionValue<number>;
  depthX?: number;
  depthY?: number;
  scrollX?: MotionValue<number>;
  scrollY?: MotionValue<number>;
  scale?: MotionValue<number> | number;
};

function HeroParallaxLayer({
  children,
  className,
  style,
  pointerX,
  pointerY,
  depthX = 0,
  depthY = 0,
  scrollX,
  scrollY,
  scale,
}: HeroParallaxLayerProps) {
  const x = useTransform(
    () => (pointerX?.get() ?? 0) * depthX + (scrollX?.get() ?? 0),
  );
  const y = useTransform(
    () => (pointerY?.get() ?? 0) * depthY + (scrollY?.get() ?? 0),
  );

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        x,
        y,
        ...(scale !== undefined ? { scale } : {}),
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.35 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.35 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -22]);
  const jarY = useTransform(scrollYProgress, [0, 1], [0, -138]);
  const jarScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const lidY = useTransform(scrollYProgress, [0, 1], [0, -112]);
  const dogY = useTransform(scrollYProgress, [0, 1], [0, -92]);
  const dogX = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const sceneRotateX = useTransform(smoothPointerY, [-1, 1], [3.5, -3.5]);
  const sceneRotateY = useTransform(smoothPointerX, [-1, 1], [-5, 5]);

  const handleSceneMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    pointerX.set(Math.max(-1, Math.min(1, nextX)));
    pointerY.set(Math.max(-1, Math.min(1, nextY)));
  };

  const resetSceneParallax = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section ref={sectionRef} className="relative isolate min-h-[100svh] overflow-hidden bg-supetz-bg pb-4 pt-4 md:pt-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-supetz-bg to-transparent" />

      <div className="hero-artboard px-4 md:px-8">
        <div className="relative hidden h-[calc(100svh-72px)] min-h-[620px] md:block">
          <div
            className="relative h-full w-full"
            onMouseMove={reduceMotion ? undefined : handleSceneMouseMove}
            onMouseLeave={reduceMotion ? undefined : resetSceneParallax}
            style={reduceMotion ? undefined : { perspective: 1800 }}
          >
            <motion.div
              className="relative h-full w-full"
              style={
                reduceMotion
                  ? undefined
                  : {
                      rotateX: sceneRotateX,
                      rotateY: sceneRotateY,
                      transformStyle: "preserve-3d",
                    }
              }
            >
              <HeroParallaxLayer
                className="desktop-hero-title z-[10]"
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                depthX={-18}
                depthY={-12}
                scrollY={headlineY}
              >
                <motion.h1
                  initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
                  className="hero-title"
                >
                  <div className="flex w-full justify-between">
                    <span>SEU</span>
                    <span>PET</span>
                  </div>
                  <div className="w-full">
                    <span>AGRADECE</span>
                  </div>
                </motion.h1>
              </HeroParallaxLayer>

              <HeroParallaxLayer
                className="hero-layer hero-jar z-20"
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                depthX={18}
                depthY={16}
                scrollY={jarY}
                scale={jarScale}
              >
                <motion.img
                  data-hero-parallax
                  initial={reduceMotion ? undefined : { opacity: 0, y: 34 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut, delay: 0.12 }}
                  src="/hero-assets/pote.png"
                  alt="Pote Supet aberto"
                  className="block w-full"
                />
              </HeroParallaxLayer>

              {GUMMY_BONES.map((bone, i) => (
                <HeroParallaxLayer
                  key={`${bone.left}-${bone.top}-${bone.size}`}
                  className="hero-layer z-30"
                  pointerX={smoothPointerX}
                  pointerY={smoothPointerY}
                  depthX={bone.size * 0.08}
                  depthY={bone.size * 0.06}
                  style={{
                    left: bone.left,
                    top: bone.top,
                    width: bone.size,
                  }}
                >
                  <motion.img
                    data-hero-float
                    initial={reduceMotion ? undefined : { opacity: 0, scale: 0.5, rotate: bone.rotate }}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            scale: 1,
                            rotate: bone.rotate,
                            y: [0, -4, 0, 3, 0],
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: { duration: motionTokens.durationBase, delay: bone.delay },
                            scale: { duration: motionTokens.durationBase, delay: bone.delay },
                            y: {
                              duration: 6 + i * 0.5,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: bone.delay,
                            },
                          }
                    }
                    src="/images/supet-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="block w-full"
                  />
                </HeroParallaxLayer>
              ))}

              <HeroParallaxLayer
                className="hero-layer hero-lid hero-lid-blend z-40"
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                depthX={26}
                depthY={18}
                scrollY={lidY}
              >
                <motion.img
                  data-hero-float
                  initial={reduceMotion ? undefined : { opacity: 0, y: -18 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: [0, -4, 0, 3, 0], rotate: [-10, -8, -10] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: { duration: motionTokens.durationBase, delay: 0.3 },
                          y: { duration: 6.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 },
                          rotate: {
                            duration: 6.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: 0.3,
                          },
                        }
                  }
                  src="/images/hero/lid.png"
                  alt="Tampa do pote Supet"
                  className="block w-full"
                />
              </HeroParallaxLayer>

              <HeroParallaxLayer
                className="hero-layer hero-dog z-50"
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                depthX={24}
                depthY={12}
                scrollX={dogX}
                scrollY={dogY}
              >
                <motion.img
                  data-hero-parallax
                  initial={reduceMotion ? undefined : { opacity: 0, x: 28 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.28 }}
                  src="/images/hero/dog-golden.png"
                  alt="Golden retriever da Supet"
                  className="block w-full"
                />
              </HeroParallaxLayer>

              <HeroParallaxLayer
                className="hero-desc-text z-[15]"
                pointerX={smoothPointerX}
                pointerY={smoothPointerY}
                depthX={-12}
                depthY={-10}
                scrollY={copyY}
              >
                <motion.div
                  initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.45 }}
                >
                  <p className="hero-desc-body">
                    Nosso suplemento em goma é
                  </p>
                  <p className="hero-desc-highlight">
                    Formulado por Farmacêutico/Nutricionista,
                  </p>
                  <p className="hero-desc-body">
                    100% vegano, livre de crueldade.
                  </p>
                </motion.div>
              </HeroParallaxLayer>
            </motion.div>
          </div>
        </div>

        <div className="relative pt-16 md:hidden">
          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            className="hero-title mobile-hero-title z-[60]"
          >
            SEU PET
            <br />
            AGRADECE
          </motion.h1>

          <div className="relative mx-auto mt-6 h-[330px] w-full max-w-[360px]">
            <motion.img
              initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.1 }}
              src="/hero-assets/pote.png"
              alt="Pote Supet aberto"
              className="hero-layer hero-jar-mobile z-20"
            />
            {GUMMY_BONES.slice(0, 8).map((bone, i) => (
              <motion.img
                key={i}
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.5 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: [0, -2, 0, 2, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                      opacity: { duration: motionTokens.durationBase, delay: bone.delay },
                      scale: { duration: motionTokens.durationBase, delay: bone.delay },
                      y: { duration: 6 + i * 0.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                    }
                }
                src="/images/supet-logo.png"
                alt=""
                aria-hidden="true"
                className="hero-layer z-30"
                style={{
                  left: bone.left,
                  top: bone.top,
                  width: bone.size * 0.6,
                  rotate: `${bone.rotate}deg`,
                }}
              />
            ))}
            <motion.img
              initial={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: [0, -2, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                    opacity: { duration: motionTokens.durationBase, delay: 0.28 },
                    y: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.28 },
                  }
              }
              src="/images/hero/lid.png"
              alt="Tampa do pote Supet"
              className="hero-layer hero-lid-mobile hero-lid-blend z-40"
            />
            <motion.img
              initial={reduceMotion ? undefined : { opacity: 0, x: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.28 }}
              src="/images/hero/dog-golden.png"
              alt="Golden retriever da Supet"
              className="hero-layer hero-dog-mobile z-50"
            />
          </div>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ duration: motionTokens.durationBase, delay: 0.5 }}
            className="mt-5 px-2 text-center text-xs font-medium leading-relaxed text-supetz-text/60"
          >
            Formulado por Farmacêutico/Nutricionista.{" "}
            <span className="font-bold text-supetz-text/85">100% vegano</span>, livre de crueldade.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
