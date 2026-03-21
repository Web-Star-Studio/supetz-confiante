import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
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

/* Bone positions designed for portrait mobile viewport (~375×700).
   Cluster around the center scene zone (top 28-55%) so they surround
   the jar/lid without covering the title above or the description below. */
const MOBILE_GUMMY_BONES = [
  // Background layer (behind jar, blurry) 
  { left: "28%", top: "55%", size: 70, rotate: 45, delay: 0.1, zIndex: 15, blur: 2 },
  { left: "86%", top: "45%", size: 65, rotate: -30, delay: 0.15, zIndex: 15, blur: 3 },
  { left: "13%", top: "62%", size: 80, rotate: 15, delay: 0.18, zIndex: 15, blur: 1.5 },
  { left: "84%", top: "58%", size: 75, rotate: -60, delay: 0.12, zIndex: 15, blur: 2 },

  // Mid layer (behind lid, above jar)
  { left: "41%", top: "45%", size: 100, rotate: -15, delay: 0.08, zIndex: 25 },
  { left: "71%", top: "38%", size: 90, rotate: 35, delay: 0.22, zIndex: 25 },
  { left: "18%", top: "48%", size: 95, rotate: 40, delay: 0.14, zIndex: 25 },
  { left: "91%", top: "36%", size: 85, rotate: -65, delay: 0.2, zIndex: 25 },
  { left: "61%", top: "52%", size: 110, rotate: 10, delay: 0.17, zIndex: 25 },
  { left: "26%", top: "32%", size: 80, rotate: 25, delay: 0.09, zIndex: 25 },

  // Foreground layer (in front of jar, pop out)
  { left: "51%", top: "62%", size: 130, rotate: -25, delay: 0.11, zIndex: 45, blur: 1 },
  { left: "84%", top: "52%", size: 140, rotate: 45, delay: 0.16, zIndex: 45, blur: 1.5 },
  { left: "16%", top: "40%", size: 120, rotate: -10, delay: 0.13, zIndex: 45 },
  { left: "76%", top: "60%", size: 115, rotate: 60, delay: 0.19, zIndex: 45 },
  { left: "34%", top: "34%", size: 125, rotate: -40, delay: 0.14, zIndex: 45 },
];

const GUMMY_BONES = [
  // Background layer (behind jar, blurry) -> size 120-145
  { left: "4%", top: "24%", size: 140, rotate: -20, delay: 0.2, zIndex: 15, blur: 3 },
  { left: "8%", top: "52%", size: 130, rotate: -60, delay: 0.28, zIndex: 15, blur: 2.5 },
  { left: "2%", top: "72%", size: 120, rotate: 10, delay: 0.32, zIndex: 15, blur: 4 },
  { left: "12%", top: "68%", size: 110, rotate: 50, delay: 0.34, zIndex: 15, blur: 3.5 },
  { left: "84%", top: "68%", size: 105, rotate: -10, delay: 0.36, zIndex: 15, blur: 3 },
  { left: "93%", top: "42%", size: 125, rotate: -40, delay: 0.26, zIndex: 15, blur: 2 },
  { left: "90%", top: "20%", size: 155, rotate: 45, delay: 0.25, zIndex: 15, blur: 2.5 },
  { left: "88%", top: "56%", size: 135, rotate: 25, delay: 0.3, zIndex: 15, blur: 3 },

  // Mid layer (behind lid, above jar, mostly sharp) -> size 140-190
  { left: "32%", top: "32%", size: 160, rotate: 55, delay: 0.18, zIndex: 25 },
  { left: "58%", top: "28%", size: 170, rotate: -50, delay: 0.12, zIndex: 25 },
  { left: "64%", top: "36%", size: 150, rotate: 35, delay: 0.22, zIndex: 25 },
  { left: "26%", top: "16%", size: 165, rotate: 40, delay: 0.14, zIndex: 25 },
  { left: "36%", top: "42%", size: 155, rotate: 10, delay: 0.17, zIndex: 25 },
  { left: "44%", top: "14%", size: 150, rotate: -15, delay: 0.08, zIndex: 25 },
  { left: "52%", top: "20%", size: 140, rotate: 20, delay: 0.15, zIndex: 25 },
  { left: "48%", top: "34%", size: 130, rotate: -40, delay: 0.2, zIndex: 25 },

  // Foreground layer (in front, slightly blurry/fast) -> size 125-155
  { left: "16%", top: "40%", size: 145, rotate: 70, delay: 0.16, zIndex: 45, blur: 1.5 },
  { left: "78%", top: "14%", size: 130, rotate: -25, delay: 0.19, zIndex: 45, blur: 2 },
  { left: "22%", top: "60%", size: 125, rotate: -45, delay: 0.24, zIndex: 45, blur: 1.5 },
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

type HeroFittedWordProps = {
  word: string;
  guide: ReactNode;
  wrapperClassName?: string;
  wordClassName?: string;
  offsetX?: string;
};

function HeroFittedWord({
  word,
  guide,
  wrapperClassName,
  wordClassName,
  offsetX = "0px",
}: HeroFittedWordProps) {
  const guideRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [scaleX, setScaleX] = useState(1);

  useLayoutEffect(() => {
    const guideElement = guideRef.current;
    const wordElement = wordRef.current;

    if (!guideElement || !wordElement) return;

    const updateScale = () => {
      const guideWidth = guideElement.offsetWidth;
      const wordWidth = wordElement.offsetWidth;

      if (!guideWidth || !wordWidth) return;

      setScaleX((guideWidth / wordWidth) * 0.995);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(guideElement);
    resizeObserver.observe(wordElement);

    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [word]);

  return (
    <div className={wrapperClassName}>
      <div ref={guideRef} className="invisible inline-flex" aria-hidden="true">
        {guide}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `translateX(${offsetX})` }}
      >
        <span
          ref={wordRef}
          className={wordClassName}
          style={{ transform: `scaleX(${scaleX})` }}
        >
          {word}
        </span>
      </div>
    </div>
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
    <section ref={sectionRef} className="relative isolate min-h-[100svh] overflow-x-clip overflow-y-visible bg-supet-bg pb-4 pt-4 md:pt-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-supet-bg to-transparent" />

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
                  <HeroFittedWord
                    word="SUPLEMENTE"
                    wrapperClassName="relative mx-auto mb-[0.02em] w-fit text-center md:mb-[0.05em]"
                    wordClassName="block origin-center whitespace-nowrap text-[0.96em] tracking-[-0.05em] opacity-90"
                    offsetX="-0.08em"
                    guide={
                      <div className="inline-flex gap-[18vw] md:gap-[22vw]">
                        <span>SEU</span>
                        <span>PET</span>
                      </div>
                    }
                  />
                  <div className="flex w-full justify-center gap-[18vw] md:gap-[22vw]">
                    <span>SEU</span>
                    <span>PET</span>
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
                  className="hero-layer"
                  pointerX={smoothPointerX}
                  pointerY={smoothPointerY}
                  depthX={bone.size * 0.08}
                  depthY={bone.size * 0.06}
                  style={{
                    left: bone.left,
                    top: bone.top,
                    width: bone.size,
                    zIndex: bone.zIndex || 30,
                    ...(bone.blur ? { filter: `blur(${bone.blur}px)` } : {}),
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
                  <p className="hero-desc-body text-balance">
                    Nosso suplemento em goma é
                  </p>
                  <p className="hero-desc-highlight text-balance">
                    Formulado por Farmacêutico/Nutricionista,
                  </p>
                  <p className="hero-desc-body text-balance">
                    100% vegano, livre de crueldade.
                  </p>
                </motion.div>
              </HeroParallaxLayer>
            </motion.div>

            <div className="hero-layer hero-dog z-50">
              <motion.img
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.28 }}
                src="/images/hero/dog-golden.png"
                alt="Golden retriever da Supet"
                className="block w-full"
              />
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100svh-56px)] min-h-[520px] md:hidden">
          <div className="relative h-full w-full overflow-hidden">
            <motion.h1
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              animate={reduceMotion ? undefined : { opacity: 0.35, y: 0 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
              className="hero-title mobile-hero-title z-[10]"
              style={{ fontSize: "clamp(4.5rem, 19vw, 6.5rem)" }}
            >
              <HeroFittedWord
                word="SUPLEMENTE"
                wrapperClassName="relative mx-auto mb-[0.02em] w-fit text-center scale-[1.04] origin-center"
                wordClassName="block origin-center whitespace-nowrap text-[0.86em] tracking-[-0.05em] opacity-90"
                offsetX="-0.03em"
                guide={
                  <div className="inline-flex gap-[20vw] md:gap-[20vw]">
                    <span>SEU</span>
                    <span>PET</span>
                  </div>
                }
              />
              <div className="flex w-full justify-center gap-[20vw] md:gap-[20vw] -translate-x-[2vw]">
                <span>SEU</span>
                <span className="translate-x-[2vw]">PET</span>
              </div>
            </motion.h1>

            <div className="hero-layer hero-jar-mobile z-20">
              <motion.img
                initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.1 }}
                src="/hero-assets/pote.png"
                alt="Pote Supet aberto"
                className="block w-full"
              />
            </div>

            {MOBILE_GUMMY_BONES.map((bone, i) => (
              <div
                key={i}
                className="hero-layer"
                style={{
                  left: bone.left,
                  top: bone.top,
                  width: bone.size,
                  zIndex: bone.zIndex || 30,
                  transform: "translate(-50%, -50%)",
                  ...(bone.blur ? { filter: `blur(${bone.blur}px)` } : {}),
                }}
              >
                <motion.img
                  initial={reduceMotion ? undefined : { opacity: 0, scale: 0.5, rotate: bone.rotate }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: 1, scale: 1, rotate: bone.rotate, y: [0, -2, 0, 2, 0] }
                  }
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
                  className="block w-full"
                />
              </div>
            ))}

            <div className="hero-layer hero-lid-mobile hero-lid-blend z-40">
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
                className="block w-full"
              />
            </div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.45 }}
              className="mobile-hero-desc z-[60]"
            >
              <p className="hero-desc-body text-balance">
                Nosso suplemento em goma é
              </p>
              <p className="hero-desc-highlight text-balance">
                Formulado por Farmacêutico/Nutricionista,
              </p>
              <p className="hero-desc-body text-balance">
                100% vegano, livre de crueldade.
              </p>
            </motion.div>
          </div>

          {/* Dog placed outside overflow-hidden so it can extend to the bottom edge */}
          <div className="hero-layer hero-dog-mobile z-50">
            <motion.img
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.28 }}
              src="/images/hero/dog-golden.png"
              alt="Golden retriever da Supet"
              className="block w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
