import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Leaf, Heart, Microscope, Target, ArrowRight, Beaker } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead, { buildBreadcrumbSchema } from "@/components/SEOHead";
import { motionTokens } from "@/lib/motion";
import FinalCTASection from "@/components/landing/FinalCTASection";

const values = [
  {
    title: "100% Natural",
    description: "Sem conservantes artificiais ou químicos agressivos. Apenas o que a natureza oferece de melhor para o seu pet.",
    icon: Leaf,
    colSpan: "col-span-1 md:col-span-2",
  },
  {
    title: "Cruelty-Free",
    description: "Amor pelos animais em cada etapa do processo. Nunca testado em animais.",
    icon: Heart,
    colSpan: "col-span-1",
  },
  {
    title: "Comprovação Clínica",
    description: "Fórmula desenvolvida e testada por veterinários dermatologistas.",
    icon: Microscope,
    colSpan: "col-span-1",
  },
  {
    title: "Foco na Raiz",
    description: "Tratamos a causa das alergias de dentro para fora, melhorando a imunidade e a barreira cutânea.",
    icon: Target,
    colSpan: "col-span-1 md:col-span-2",
  },
];

const narrativeSteps = [
  {
    image: "/images/symptom_scratching.png",
    title: "A Raiz do",
    highlight: "problema.",
    text: "Por anos, o mercado pet se contentou em mascarar os sintomas. Pomadas que aliviam por horas, injeções com efeitos colaterais terríveis a longo prazo. Sabíamos que a pele não é o problema; ela é o alarme de que algo interno não está bem."
  },
  {
    image: "/images/product-laboratory-v3.png",
    title: "Nossa",
    highlight: "obsessão.",
    text: "Mergulhamos em pesquisas imersivas com dermatologistas veterinários de ponta. A imunidade intestinal e a barreira protetora da pele precisavam ser nossa base. O objetivo nunca foi apenas parar a coceira, mas devolver a paz profunda ao animal."
  },
  {
    image: "/images/pet-healthy-coat.png",
    title: "Poder",
    highlight: "natural.",
    text: "Chegamos a uma matriz exata: Ômega 3 hiper-concentrado, Zinco quelato e Biotina ativa, todos extraídos de fontes rigorosamente limpas. O resultado é orgânico, visível e definitivo. A saúde reconstruída de dentro para fora."
  }
];

const teamData = [
  { name: "Sophia", role: "Tutora do Max (Golden)", img: "/images/tutor_1.png", bio: "O Max sofria com dermatite severa e lambedura de patas crônica. Desde que começamos com a Supet, ele não apenas parou de se coçar, como a energia dele dobrou." },
  { name: "Lucas", role: "Tutor do Thor (Buldogue Francês)", img: "/images/tutor_2.png", bio: "Buldogues têm pele incrivelmente sensível. A Supet foi a única abordagem natural que conseguiu domar as inflamações constantes do Thor de vez." },
  { name: "Carolina", role: "Tutora da Nina (Terrier)", img: "/images/tutor_3.png", bio: "Eu não queria depender de pomadas de corticoide pro resto da vida da Nina. A nutrição preventiva da Supet construiu uma barreira na pele que funciona mesmo." }
];

export default function Sobre() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Narrative Cinematic Scroll
  const narrativeRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: narrativeScroll } = useScroll({
    target: narrativeRef,
    offset: ["start start", "end end"]
  });
  const step0Opacity = useTransform(narrativeScroll, [0, 0.2, 0.3], [1, 1, 0]);
  const step1Opacity = useTransform(narrativeScroll, [0.25, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
  const step2Opacity = useTransform(narrativeScroll, [0.65, 0.8, 1], [0, 1, 1]);

  // States
  const [activeIngredient, setActiveIngredient] = useState(0);
  const [activeExpert, setActiveExpert] = useState<number | null>(null);

  const ingredients = [
    { id: "omega3", title: "Ômega 3 Puro", desc: "Extraído de águas profundas, age implacavelmente contra inflamações celulares.", img: "/images/omega3-v2.png" },
    { id: "biotina", title: "Biotina Ativa", desc: "Reconstrói a queratina danificada, devolvendo brilho e espessura à pelagem.", img: "/images/biotina-v3.png" },
    { id: "zinco", title: "Zinco Quelato", desc: "A base biológica para a rápida cicatrização de feridas e hot spots.", img: "/images/zinco-v4.png" },
    { id: "vitamina-e", title: <>Vitamina E<br />D-Alpha</>, altText: "Vitamina E D-Alpha", desc: "O escudo antioxidante natural que previne o envelhecimento celular precoce.", img: "/images/vitamina-e-v2.png" }
  ];

  return (
      <SEOHead
        title="Sobre a Supet"
        description="Conheça a missão da Supet: criar suplementos 100% naturais e aprovados por veterinários para acabar com coceiras, alergias e queda de pelo nos cães."
        path="/sobre"
        jsonLd={buildBreadcrumbSchema([
          { name: "Home", url: "https://supetz-playful-trust.lovable.app/" },
          { name: "Sobre", url: "https://supetz-playful-trust.lovable.app/sobre" },
        ])}
      />
      <div ref={containerRef} className="relative bg-supet-bg">
        
        {/* Dynamic Hero */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 pointer-events-none -z-10"
          >
            <div className="absolute inset-0 bg-supet-bg/80 backdrop-blur-sm z-10" />
            <img
              src="/images/pet-happy-playing.png"
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover object-top opacity-30 grayscale mix-blend-multiply"
            />
            <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-supet-orange/15 rounded-full blur-[120px] z-20" />
            <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-supet-orange/10 rounded-full blur-[100px] z-20" />
          </motion.div>

          <div className="max-w-5xl mx-auto w-full text-center relative z-30">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
              className="flex flex-col items-center"
            >
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-supet-orange mb-8 flex items-center gap-4">
                <span className="w-12 h-[2px] bg-supet-orange/50"></span>
                Nossa Essência
                <span className="w-12 h-[2px] bg-supet-orange/50"></span>
              </span>

              <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-supet-text leading-[0.9] tracking-[-0.03em] uppercase mb-8 text-balance">
                A Ciência do <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-supet-orange to-[#ff9e59] italic font-serif lowercase font-medium">
                  cuidado.
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-supet-text/80 font-medium leading-relaxed max-w-3xl mx-auto border-l-2 border-r-2 border-supet-orange/30 px-6 md:px-12 py-4 text-balance">
                Acreditamos que cada momento ao lado do seu pet deve ser focado em alegria, não em desconforto. Existimos para erradicar as alergias cutâneas de forma natural, segura e definitiva.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Editorial Values List */}
        <section className="py-24 md:py-40 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 md:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="lg:sticky lg:top-32 h-fit"
            >
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center gap-4 mb-4">
                <span className="w-8 h-[2px] bg-supet-orange/50"></span> Princípios
              </span>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-supet-text leading-[0.9] tracking-tight text-balance">
                Nossos <span className="text-supet-orange italic font-serif">Valores.</span>
              </h2>
              <p className="mt-6 text-lg md:text-xl text-supet-text/70 font-medium text-balance max-w-md">
                Mais do que promessas, estes são os pilares inegociáveis que sustentam cada fórmula que desenvolvemos.
              </p>
            </motion.div>

            <div className="flex flex-col">
              {values.map((val, idx) => (
                <motion.div
                  key={val.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: motionTokens.easeOut }}
                  className="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 border-t border-supet-text/10 hover:border-supet-orange/30 transition-colors duration-500 first:border-0"
                >
                  <div className="w-16 h-16 bg-supet-bg rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-supet-orange group-hover:text-white transition-colors duration-500 mt-2">
                     <val.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-supet-text mb-3 tracking-tight group-hover:text-supet-orange transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-supet-text/65 leading-relaxed text-lg max-w-xl mx-auto md:mx-0">
                      {val.description}
                    </p>
                  </div>
                  <div className="hidden md:block text-5xl md:text-6xl font-black text-supet-text/5 group-hover:text-supet-orange/10 transition-colors duration-500 font-serif italic">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              ))}
              <div className="border-t border-supet-text/10 w-full" />
            </div>
          </div>
        </section>

        {/* Narrative Scroll Sequence (Raiz do Problema) */}
        <section ref={narrativeRef} className="h-[300vh] relative bg-black">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
            
            <motion.div style={{ opacity: step0Opacity }} className="absolute inset-0">
               <img src={narrativeSteps[0].image} className="w-full h-full object-cover opacity-50" />
            </motion.div>
            <motion.div style={{ opacity: step1Opacity }} className="absolute inset-0">
               <img src={narrativeSteps[1].image} className="w-full h-full object-cover opacity-50" />
            </motion.div>
            <motion.div style={{ opacity: step2Opacity }} className="absolute inset-0">
               <img src={narrativeSteps[2].image} className="w-full h-full object-cover opacity-50" />
            </motion.div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full h-full flex items-center">
              
              <motion.div style={{ opacity: step0Opacity, pointerEvents: 'none' }} className="absolute w-full max-w-3xl">
                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9] mb-8">
                  {narrativeSteps[0].title} <br/>
                  <span className="text-supet-orange italic font-serif opacity-90">{narrativeSteps[0].highlight}</span>
                </h2>
                <p className="text-xl md:text-3xl text-white/80 font-light leading-relaxed border-l-2 border-supet-orange/50 pl-6">
                  {narrativeSteps[0].text}
                </p>
              </motion.div>

              <motion.div style={{ opacity: step1Opacity, pointerEvents: 'none' }} className="absolute w-full max-w-3xl md:right-6 md:text-right">
                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9] mb-8">
                  {narrativeSteps[1].title} <br/>
                  <span className="text-supet-orange italic font-serif opacity-90">{narrativeSteps[1].highlight}</span>
                </h2>
                <p className="text-xl md:text-3xl text-white/80 font-light leading-relaxed border-r-2 border-supet-orange/50 pr-6">
                  {narrativeSteps[1].text}
                </p>
              </motion.div>

              <motion.div style={{ opacity: step2Opacity, pointerEvents: 'none' }} className="absolute w-full max-w-3xl">
                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9] mb-8">
                  {narrativeSteps[2].title} <br/>
                  <span className="text-supet-orange italic font-serif opacity-90">{narrativeSteps[2].highlight}</span>
                </h2>
                <p className="text-xl md:text-3xl text-white/80 font-light leading-relaxed border-l-2 border-supet-orange/50 pl-6">
                  {narrativeSteps[2].text}
                </p>
              </motion.div>

            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-supet-bg to-transparent" />
          </div>
        </section>

        {/* Editorial Story (Zig-Zag Flow) */}
        <section className="py-24 md:py-40 bg-supet-bg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-supet-orange/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 space-y-32">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
               <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-4">
                <span className="w-8 h-[2px] bg-supet-orange/50"></span> Origem
              </span>
              <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-extrabold text-supet-text leading-[0.9] tracking-tight">
                Como tudo <span className="text-supet-orange italic font-serif">começou.</span>
              </h2>
            </div>

            {/* Block 1: Left Text, Right Image */}
            <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24 relative">
              <span className="absolute -left-4 md:-left-12 -top-12 md:-top-24 text-[10rem] md:text-[20rem] font-serif italic text-supet-text/5 font-black leading-none select-none z-0">01</span>
              <motion.div 
                initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                className="w-full md:w-1/2 relative z-10"
              >
                <h3 className="text-4xl md:text-5xl font-black text-supet-text mb-6 tracking-tight text-balance">O Falso Alívio</h3>
                <p className="text-lg md:text-xl text-supet-text/70 leading-relaxed text-balance">
                  A dor de ver nossos próprios cães sofrendo com alergias contínuas foi o estopim. Após tentarmos inúmeros tratamentos sintéticos e pomadas caras, o mercado só exibia paliativos que mascaravam sintomas.
                </p>
              </motion.div>
              <div className="w-full md:w-1/2 h-[400px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 border border-supet-text/5">
                 <img src="/images/lifestyle-dog.png" alt="História" className="w-full h-full object-cover object-center md:object-[center_20%]" />
                 <div className="absolute inset-0 bg-supet-orange/5 mix-blend-overlay pointer-events-none" />
              </div>
            </div>

            {/* Block 2: Left Image, Right Text */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 relative">
              <span className="absolute -right-4 md:-right-12 -top-12 md:-top-24 text-[10rem] md:text-[20rem] font-serif italic text-supet-orange/5 font-black leading-none select-none z-0">02</span>
              <div className="w-full md:w-1/2 h-[400px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 border border-supet-text/5">
                 <img src="/images/product-laboratory-v3.png" alt="Laboratório" className="w-full h-full object-cover object-center" />
                 <div className="absolute inset-0 bg-supet-text/5 mix-blend-overlay pointer-events-none" />
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                className="w-full md:w-1/2 relative z-10"
              >
                <h3 className="text-4xl md:text-5xl font-black text-supet-text mb-6 tracking-tight text-balance">A Ciência de Base</h3>
                <p className="text-lg md:text-xl text-supet-text/70 leading-relaxed text-balance">
                  O objetivo nunca foi parar a coceira no momento, e sim devolver a paz profunda. Mergulhamos em pesquisas para formular uma matriz celular com grau humano. Extraindo pureza de onde a natureza atua melhor.
                </p>
              </motion.div>
            </div>

             {/* Block 3: Left Text, Right Image */}
             <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24 relative">
              <span className="absolute -left-4 md:-left-12 -top-12 md:-top-24 text-[10rem] md:text-[20rem] font-serif italic text-supet-text/5 font-black leading-none select-none z-0">03</span>
              <motion.div 
                initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                className="w-full md:w-1/2 relative z-10"
              >
                <h3 className="text-4xl md:text-5xl font-black text-supet-text mb-6 tracking-tight text-balance">A Cura Definitiva</h3>
                <p className="text-lg md:text-xl text-supet-text/70 leading-relaxed text-balance">
                   Hoje, a Supet se orgulha de reconstruir as barreiras protetoras de milhares de cães no Brasil todo. Não fazemos remédios, fazemos nutrição funcional preventiva. O resultado fala por ele mesmo: cães felizes.
                </p>
              </motion.div>
              <div className="w-full md:w-1/2 h-[400px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 border border-supet-text/5">
                 <img src="/images/pet-happy-playing.png" alt="Cão feliz" className="w-full h-full object-cover object-top" />
                 <div className="absolute inset-0 bg-supet-orange/5 mix-blend-overlay pointer-events-none" />
              </div>
            </div>

          </div>
        </section>

        {/* Ingredients Showcase (Sticky Stacked Cards) */}
        <section className="py-24 md:py-40 bg-supet-bg/50 px-6 relative z-20">
          <div className="max-w-6xl mx-auto">
             
            <div className="text-center mb-16 md:mb-32">
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-4">
                  <span className="w-8 h-[2px] bg-supet-orange/50"></span> O Segredo
                </span>
                <h2 className="text-[clamp(3rem,6vw,6rem)] font-extrabold text-supet-text tracking-tight leading-[0.9]">
                  A pureza da <br />
                  <span className="text-supet-orange italic font-serif">Nossa Fórmula.</span>
                </h2>
            </div>
            
            <div className="relative pb-32 flex flex-col gap-6 md:gap-12">
              {ingredients.map((item, idx) => {
                 const isDark = idx % 2 === 1; // 0: light, 1: dark, 2: light, 3: dark
                 
                 return (
                  <div
                    key={item.id}
                    className={`sticky w-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row transition-transform duration-500 ease-out border border-black/5`}
                    style={{ 
                       top: `calc(10vh + ${idx * 30}px)`,
                       backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                       color: isDark ? '#ffffff' : '#1a1a1a',
                       height: 'calc(100vh - 20vh)' // Approx 80vh to allow nice viewing space
                    }}
                  >
                     <div className="w-full md:w-[55%] p-10 md:p-20 flex flex-col justify-center relative order-2 md:order-1 h-1/2 md:h-full">
                         <span className={`absolute top-8 right-8 md:top-12 md:right-12 text-7xl md:text-[12rem] font-serif italic font-black leading-none select-none ${isDark ? 'text-white/5' : 'text-black/5'}`}>
                           0{idx + 1}
                         </span>
                         <h3 className="text-3xl md:text-6xl font-black mb-4 md:mb-8 tracking-tight relative z-10 leading-[0.9]">{item.title}</h3>
                         <p className={`text-base md:text-2xl font-medium leading-relaxed relative z-10 max-w-xl ${isDark ? 'text-white/70' : 'text-black/60'}`}>
                           {item.desc}
                         </p>
                     </div>
                     <div className="w-full md:w-[45%] h-1/2 md:h-full relative order-1 md:order-2">
                         <img src={item.img} alt={item.altText || (typeof item.title === 'string' ? item.title : item.id)} className="absolute inset-0 w-full h-full object-cover" />
                         {isDark && <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />}
                     </div>
                  </div>
                 );
              })}
            </div>

          </div>
        </section>

        {/* Expanding Flex Cards (Vidas Transformadas) */}
        <section className="py-24 md:py-40 bg-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            
            <div className="text-center mb-16 md:mb-24">
                 <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-supet-orange flex items-center justify-center gap-4 mb-4">
                  <span className="w-8 h-[2px] bg-supet-orange/50"></span> O Veredito final
                 </span>
                 <h2 className="text-[clamp(3rem,6vw,6rem)] font-black text-supet-text leading-[0.9] tracking-tight">
                   Vidas <br/><span className="italic font-serif text-supet-orange">Transformadas.</span>
                 </h2>
                 <p className="mt-6 text-lg md:text-xl text-supet-text/60 font-medium text-balance max-w-2xl mx-auto md:hidden">
                   Toque em cada história para ler o depoimento completo.
                 </p>
                 <p className="mt-6 text-lg md:text-xl text-supet-text/60 font-medium text-balance max-w-2xl mx-auto hidden md:block">
                   Passe o mouse por cada imagem para conhecer os cães e tutores que viveram nossa revolução de perto.
                 </p>
            </div>
              
            <div className="flex flex-col md:flex-row h-[900px] md:h-[700px] gap-4 w-full md:group/accordion">
              {teamData.map((expert, idx) => {
                const isActive = activeExpert === idx;
                
                return (
                <div 
                  key={expert.name}
                  onClick={() => setActiveExpert(isActive ? null : idx)}
                  className={`relative overflow-hidden rounded-[2rem] h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer border border-supet-text/5 group/card md:group-hover/accordion:flex-[1] md:hover:!flex-[8] ${
                    isActive ? "flex-[12]" : "flex-[2]"
                  }`}
                >
                  <img src={expert.img} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] md:group-hover/card:scale-105 ${isActive ? 'scale-105' : ''}`} />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 md:group-hover/card:opacity-90 ${isActive ? 'opacity-90' : 'opacity-80'}`} />
                  
                  {/* Minimized Content (Vertical text on desktop when inactive) */}
                  <div className={`absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-300 md:[writing-mode:vertical-lr] md:items-center md:group-hover/card:opacity-0 ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}>
                     <h3 className="text-3xl font-black text-white whitespace-nowrap">{expert.name}</h3>
                  </div>

                  {/* Expanded Content */}
                  <div className={`absolute inset-0 flex flex-col justify-end p-6 md:p-12 transition-opacity duration-700 delay-100 md:group-hover/card:opacity-100 ${
                    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none md:pointer-events-auto'
                  }`}>
                    <div className="max-w-xl">
                      <Heart className="w-8 h-8 text-supet-orange mb-4 md:mb-6" fill="currentColor" />
                      <h3 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">{expert.name}</h3>
                      <p className="text-supet-orange font-bold uppercase tracking-widest text-[10px] md:text-sm mb-4 md:mb-6">{expert.role}</p>
                      <p className="text-white/90 text-sm md:text-xl font-medium leading-relaxed border-l-2 border-supet-orange pl-4">&quot;{expert.bio}&quot;</p>
                    </div>
                  </div>
                </div>
              )})}
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <FinalCTASection />
      </div>
    </Layout>
  );
}
