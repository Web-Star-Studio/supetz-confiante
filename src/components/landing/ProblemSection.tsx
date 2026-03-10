import { motion, useReducedMotion, useScroll, useTransform, Variants } from "framer-motion";
import { useRef, useState } from "react";
import { motionTokens } from "@/lib/motion";

const symptomsList = [
  {
    num: "01",
    title: "Coceiras constantes",
    desc: "O primeiro e mais irritante sinal de que a imunidade da pele e a barreira protetora falharam.",
    img: "/images/pet-badboy.png"
  },
  {
    num: "02",
    title: "Lamber as patas",
    desc: "Um comportamento compulsivo que indica desconforto, alergia ou inflamação localizada nas extremidades.",
    img: "/images/dog-closeup.png"
  },
  {
    num: "03",
    title: "Queda excessiva",
    desc: "Muito além da troca sazonal. Falhas na pelagem e pelos opacos refletem ausência de nutrientes essenciais.",
    img: "/images/pet-studio.png"
  },
  {
    num: "04",
    title: "Mau cheiro nas orelhas",
    desc: "Sinal claro de desequilíbrio fúngico ou bacteriano, muitas vezes ligado à imunidade baixa.",
    img: "/images/pet-fashion.png"
  },
  {
    num: "05",
    title: "Comer grama freq.",
    desc: "Instinto natural para tentar aliviar desconfortos gástricos e problemas na digestão e microbiota intestinal.",
    img: "/images/lifestyle-dog.png"
  },
  {
    num: "06",
    title: "Esfregar o bumbum",
    desc: "Forte indicativo de problemas nas glândulas ou incômodos inflamatórios locais.",
    img: "/images/pet-winter.png"
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

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeSymptom, setActiveSymptom] = useState(0);

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
        className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-supetz-orange/12 blur-[120px]"
      />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#f3aa2f]/10 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="mx-auto max-w-4xl text-center"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-supetz-orange">Problema real</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,4.05rem)] font-bold uppercase leading-[0.9] tracking-[-0.022em] text-supetz-text">
            O sintoma aparece na pele.
            <span className="mt-2 block font-semibold text-supetz-orange">A causa comeca por dentro.</span>
          </h2>
          <p className="mt-6 text-[1rem] font-medium leading-relaxed text-supetz-text/78 md:text-[1.16rem]">
            Esses sinais indicam um desequilibrio silencioso. Tratar apenas o que aparece por fora costuma manter o
            ciclo ativo.
          </p>
        </motion.div>

        {/* Editorial Hover Style Layout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut, delay: 0.08 }}
          className="mx-auto mt-16 md:mt-24 max-w-7xl lg:px-8"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
            {/* Left: Text List */}
            <div className="flex flex-col w-full z-10">
              <div className="mb-12">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-supetz-text/58 mb-2">O que você observa</p>
                <h3 className="font-display text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight text-supetz-text leading-none">Sinais<br className="hidden md:block" /> Óbvios</h3>
                <p className="text-supetz-text/70 mt-6 max-w-sm text-sm md:text-base font-medium leading-relaxed">
                  Seu pet não consegue falar, mas o corpo dele dá sinais claros de que a barreira protetora falhou.
                </p>
              </div>

              <div className="flex flex-col border-t border-supetz-text/10">
                {symptomsList.map((item, idx) => {
                  const isActive = activeSymptom === idx;
                  return (
                    <div
                      key={item.num}
                      onMouseEnter={() => setActiveSymptom(idx)}
                      className={`group cursor-pointer border-b border-supetz-text/10 py-6 md:py-8 transition-colors duration-500 ${isActive ? 'bg-transparent' : 'hover:bg-supetz-orange/5'}`}
                    >
                      <div className="flex gap-6 items-start px-2 lg:px-4">
                        <span className={`font-black text-sm md:text-base mt-2 transition-colors duration-500 ${isActive ? 'text-supetz-orange' : 'text-supetz-text/30'}`}>{item.num}</span>
                        <div>
                          <h4 className={`font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight transition-colors duration-500 ${isActive ? 'text-supetz-text' : 'text-supetz-text/40'}`}>
                            {item.title}
                          </h4>
                          <motion.div
                            initial={false}
                            animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                            className="overflow-hidden"
                          >
                            <p className="pt-4 text-supetz-text/70 font-medium text-[1.1rem] max-w-md leading-relaxed">
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

            {/* Right: Sticky Image */}
            <div className="hidden lg:block relative">
              <div className="sticky top-32 h-[75vh] min-h-[600px] w-full rounded-[2.5rem] overflow-hidden bg-[#1A1918] shadow-2xl">
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

        <div className="mt-16 border-t border-supetz-text/10 pt-16 md:pt-24 lg:pt-32">
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

              <h3 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tight text-supetz-text">
                Quebrando o ciclo <br />
                da <span className="text-supetz-orange italic font-serif font-medium">forma certa.</span>
              </h3>
            </div>
            <p className="md:max-w-md text-base lg:text-lg text-supetz-text/70 font-medium leading-relaxed md:text-right border-l-2 md:border-l-0 md:border-r-2 border-supetz-orange/20 pl-4 md:pl-0 md:pr-4">
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
              className="relative overflow-hidden rounded-[2rem] border border-supetz-text/5 bg-white p-8 md:p-12 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-supetz-text/5 flex items-center justify-center">
                  <span className="text-supetz-text/40 font-black text-xl">✕</span>
                </div>
                <h4 className="font-display text-2xl font-bold tracking-tight text-supetz-text">
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
                    className="flex flex-col gap-2 relative pl-6 border-l-[3px] border-supetz-text/10 group-hover:border-supetz-text/30 transition-colors"
                  >
                    <h5 className="text-[1.15rem] font-bold leading-none text-supetz-text tracking-tight">{item.title}</h5>
                    <p className="text-[0.95rem] font-medium leading-relaxed text-supetz-text/60 mt-1">{item.desc}</p>
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
              className="relative overflow-hidden rounded-[2rem] border border-supetz-orange/20 bg-supetz-orange p-8 md:p-12 shadow-[0_20px_50px_-15px_rgba(255,122,0,0.3)] text-white group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-supetz-orange-dark to-supetz-orange opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              />

              {/* Background abstract image/texture */}
              <div className="absolute -bottom-20 -right-20 w-[120%] h-[120%] opacity-15 mix-blend-overlay pointer-events-none">
                <img src="/images/hero-dog.png" alt="" className="w-full h-full object-cover grayscale" />
              </div>

              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
