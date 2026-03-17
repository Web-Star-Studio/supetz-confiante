import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { motionTokens } from "@/lib/motion";

const symptomsList = [
  {
    num: "01",
    title: "Coceiras constantes",
    desc: "O primeiro e mais irritante sinal de que a imunidade da pele e a barreira protetora falharam.",
    img: "/images/symptom_scratching.png"
  },
  {
    num: "02",
    title: "Lamber as patas",
    desc: "Um comportamento compulsivo que indica desconforto, alergia ou inflamação localizada nas extremidades.",
    img: "/images/symptom_licking.png"
  },
  {
    num: "03",
    title: "Queda excessiva",
    desc: "Muito além da troca sazonal. Falhas na pelagem e pelos opacos refletem ausência de nutrientes essenciais.",
    img: "/images/symptom_hairloss.png"
  },
  {
    num: "04",
    title: "Mau cheiro nas orelhas",
    desc: "Sinal claro de desequilíbrio fúngico ou bacteriano, muitas vezes ligado à imunidade baixa.",
    img: "/images/symptom_ear.png"
  },
  {
    num: "05",
    title: "Comer grama freq.",
    desc: "Instinto natural para tentar aliviar desconfortos gástricos e problemas na digestão e microbiota intestinal.",
    img: "/images/symptom_grass.png"
  },
  {
    num: "06",
    title: "Esfregar o bumbum",
    desc: "Forte indicativo de problemas nas glândulas ou incômodos inflamatórios locais.",
    img: "/images/symptom_scooting.png"
  }
];



const effects = [
  "O sistema imunologico enfraquece",
  "Surgem alergias recorrentes",
  "A barreira da pele fica fragilizada",
];

const commonApproach = [
  {
    title: "Camuflagem de sintomas",
    desc: "Cremes e antialérgicos agem apenas na superfície. O alívio pode até ser rápido, mas a raiz do problema segue completamente intacta."
  },
  {
    title: "Recaídas garantidas",
    desc: "Assim que o efeito do remédio passa, a baixa imunidade permite que coceiras e inflamações retornem com ainda mais força."
  },
  {
    title: "Ciclo de dependência",
    desc: "O uso prolongado de antibióticos e corticoides destrói a microbiota intestinal, piorando gradualmente a defesa natural do pet."
  }
];

const supetApproach = [
  {
    title: "Ação de dentro para fora",
    desc: "Atuamos diretamente no sistema imunológico para fortalecer a barreira protetora da pele antes mesmo que os sinais se agravem."
  },
  {
    title: "Resultados duradouros",
    desc: "Sem corticoides. Uma suplementação diária e contínua que reduz gatilhos e constrói uma saúde estável a longo prazo."
  },
  {
    title: "Restauração profunda",
    desc: "Ativos de alta absorção recompõem a microbiota, devolvendo a alegria, a pelagem brilhante e a energia que seu pet merece."
  }
];

interface PawPrint {
  id: number;
  x: number;
  y: number;
  rotate: number;
  createdAt: number;
}

/* Faint background paws — hint the area is interactive */
const AMBIENT_PAWS = [
  { x: 8,  y: 22, rotate: -22, opacity: 0.055 },
  { x: 90, y: 58, rotate: 14,  opacity: 0.045 },
  { x: 38, y: 82, rotate: -10, opacity: 0.035 },
  { x: 74, y: 12, rotate: 20,  opacity: 0.05 },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeSymptom, setActiveSymptom] = useState(0);

  /* ── Interactive paw trail ── */
  const [pawPrints, setPawPrints] = useState<PawPrint[]>([]);
  const pawIdRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handlePawMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 7) return;

    lastPosRef.current = { x, y };
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const isLeft = pawIdRef.current % 2 === 0;

    // Perpendicular offset for natural L/R alternation
    const perpRad = (angle - 90) * (Math.PI / 180);
    const off = isLeft ? -2.2 : 2.2;

    setPawPrints(prev => [
      ...prev.slice(-15),
      {
        id: pawIdRef.current++,
        x: x + Math.cos(perpRad) * off,
        y: y + Math.sin(perpRad) * off,
        rotate: angle - 90 + (isLeft ? -12 : 12),
        createdAt: Date.now(),
      },
    ]);
  }, []);

  // Auto-cleanup expired paw prints
  useEffect(() => {
    const timer = setInterval(() => {
      setPawPrints(prev => {
        const now = Date.now();
        const next = prev.filter(p => now - p.createdAt < 4000);
        return next.length < prev.length ? next : prev;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const orbY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  return (
    <section ref={sectionRef} id="problema" className="relative overflow-hidden bg-[#f1ece6] py-24 md:py-32">
      <motion.div
        aria-hidden="true"
        style={reduceMotion ? undefined : { y: orbY }}
        className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-supet-orange/12 blur-[120px]"
      />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#f3aa2f]/10 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Editorial Hover Style Layout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.08 }}
          className="mx-auto max-w-7xl lg:px-8"
        >
          <div className="mb-20 md:mb-32 relative text-center" onMouseMove={handlePawMove}>
            {/* Ambient texture paws — very faint, gentle float, behind text */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-visible">
              {AMBIENT_PAWS.map((paw, i) => (
                <motion.img
                  key={`ambient-${i}`}
                  src="/images/paw.svg"
                  alt=""
                  animate={{ y: ['-48%', '-53%', '-48%'] }}
                  transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: `${paw.x}%`,
                    top: `${paw.y}%`,
                    width: 'clamp(65px, 7vw, 95px)',
                    opacity: paw.opacity,
                    rotate: paw.rotate,
                    x: '-50%',
                    y: '-50%',
                  }}
                />
              ))}

              {/* Interactive mouse-trail paw prints */}
              {pawPrints.map(paw => (
                <motion.img
                  key={paw.id}
                  src="/images/paw.svg"
                  alt=""
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.5, 0.5, 0],
                    scale: [0, 1.15, 1, 0.95],
                  }}
                  transition={{
                    duration: 4,
                    times: [0, 0.06, 0.5, 1],
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${paw.x}%`,
                    top: `${paw.y}%`,
                    width: 'clamp(42px, 4.5vw, 60px)',
                    rotate: paw.rotate,
                    x: '-50%',
                    y: '-50%',
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>

            {/* Heading text — above paw layer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-supet-orange/60 mb-6">O que você observa</p>
              <h2 className="font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold uppercase leading-[0.8] tracking-[-0.04em] text-supet-text text-balance">
                Sinais <br />
                <span className="text-supet-orange italic font-serif font-medium lowercase tracking-normal px-2">óbvios</span>
              </h2>
              <div className="mt-12 mx-auto w-12 h-[2px] bg-supet-orange/30 mb-12" />
              <p className="text-supet-text/80 mx-auto max-w-2xl text-xl md:text-2xl font-medium leading-relaxed tracking-tight text-balance">
                Seu pet não consegue falar, mas o corpo dele dá sinais claros de que a <span className="text-supet-text">barreira protetora falhou.</span>
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
            {/* Left: Text List */}
            <div className="flex flex-col w-full z-10">
              <div className="flex flex-col border-t border-supet-text/10">
                {symptomsList.map((item, idx) => {
                  const isActive = activeSymptom === idx;
                  return (
                    <div
                      key={item.num}
                      onMouseEnter={() => setActiveSymptom(idx)}
                      className={`group cursor-pointer border-b border-supet-text/10 py-6 md:py-8 transition-colors duration-500 ${isActive ? 'bg-transparent' : 'hover:bg-supet-orange/5'}`}
                    >
                      <div className="flex gap-6 items-start px-2 lg:px-4">
                        <span className={`font-black text-sm md:text-base mt-2 transition-colors duration-500 ${isActive ? 'text-supet-orange' : 'text-supet-text/30'}`}>{item.num}</span>
                        <div>
                          <h4 className={`font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight transition-colors duration-500 ${isActive ? 'text-supet-text' : 'text-supet-text/40'}`}>
                            {item.title}
                          </h4>
                          <motion.div
                            initial={false}
                            animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                            className="overflow-hidden"
                          >
                            <p className="pt-4 text-supet-text/70 font-medium text-[1.1rem] max-w-md leading-relaxed">
                              {item.desc}
                            </p>

                            {/* Mobile Image (Hidden on Desktop) */}
                            <div className="mt-6 w-full h-56 rounded-2xl overflow-hidden lg:hidden">
                              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Image */}
            <div className="hidden lg:block relative h-full">
              <div className="h-full w-full rounded-2xl overflow-hidden bg-[#1A1918] shadow-2xl relative isolate" style={{ maskImage: 'radial-gradient(white, black)' }}>
                {symptomsList.map((item, idx) => (
                  <motion.img
                    key={item.img}
                    src={item.img}
                    initial={false}
                    animate={{
                      opacity: activeSymptom === idx ? 1 : 0,
                      scale: activeSymptom === idx ? 1 : 1.05,
                      filter: activeSymptom === idx ? 'blur(0px)' : 'blur(10px)'
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 border-t border-supet-text/10 pt-16 md:pt-24 lg:pt-32">
          {/* Animated Section Header */}
          {/* Animated Section Header (Editorial Split) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 lg:gap-16 mb-16"
          >
            <div className="max-w-2xl">

              <h3 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tight text-supet-text text-balance">
                Quebrando o ciclo <br />
                da <span className="text-supet-orange italic font-serif font-medium">forma certa.</span>
              </h3>
            </div>
            <p className="md:max-w-md text-base lg:text-lg text-supet-text/70 font-medium leading-relaxed md:text-right border-l-2 md:border-l-0 md:border-r-2 border-supet-orange/20 pl-4 md:pl-0 md:pr-4 text-balance">
              Por que cremes antialérgicos e shampoos medicinais não funcionam no longo prazo? Entenda a diferença cirúrgica entre camuflar sintomas e restaurar seu pet de dentro para fora.
            </p>
          </motion.div>

          {/* Visual Comparison Cards */}
          <div className="mt-16 md:mt-24 grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-stretch">
            {/* Bad Approach Card */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotateY: 10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
              className="relative overflow-hidden rounded-[2.5rem] border border-supet-text/5 bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 font-black text-xl">✕</span>
                </div>
                <h4 className="font-display text-2xl font-bold tracking-tight text-supet-text">
                  Tratamento Comum
                </h4>
              </div>

              <div className="space-y-8">
                {commonApproach.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    className="flex flex-col gap-2 relative pl-6 border-l-[3px] border-supet-text/10 group-hover:border-supet-text/30 transition-colors"
                  >
                    <h5 className="text-[1.15rem] font-bold leading-none text-supet-text tracking-tight">{item.title}</h5>
                    <p className="text-[0.95rem] font-medium leading-relaxed text-supet-text/60 mt-1">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Supet Approach Card (with Image) */}
            <motion.div
              initial={{ opacity: 0, x: 30, rotateY: -10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut, delay: 0.1 }}
              className="relative overflow-hidden rounded-[2.5rem] border border-supet-orange/20 bg-supet-orange p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(255,122,0,0.4)] text-white group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-supet-orange-dark to-supet-orange opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              />

              {/* Background abstract image/texture */}
              <div className="absolute -bottom-20 -right-20 w-[120%] h-[120%] opacity-15 mix-blend-overlay pointer-events-none">
                <img src="/images/product-lifestyle.png" alt="" className="w-full h-full object-cover grayscale" />
              </div>

              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-display text-2xl font-bold tracking-tight text-white">
                  Abordagem Supet
                </h4>
              </div>

              <div className="relative z-10 space-y-8">
                {supetApproach.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex flex-col gap-2 relative pl-6 border-l-[3px] border-white/20 hover:border-white/60 transition-colors"
                  >
                    <h5 className="text-[1.15rem] font-bold leading-none text-white tracking-tight">{item.title}</h5>
                    <p className="text-[0.95rem] font-medium leading-relaxed text-white/80 mt-1">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
