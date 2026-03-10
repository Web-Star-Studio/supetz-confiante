import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { motionTokens } from "@/lib/motion";
import FinalCTASection from "@/components/landing/FinalCTASection";

const values = [
  {
    title: "100% Natural",
    description: "Sem conservantes artificiais ou químicos agressivos. Apenas o que a natureza oferece de melhor para o seu pet.",
    icon: "🌿",
    colSpan: "col-span-1 md:col-span-2",
  },
  {
    title: "Cruelty-Free",
    description: "Amor pelos animais em cada etapa do processo. Nunca testado em animais.",
    icon: "🐇",
    colSpan: "col-span-1",
  },
  {
    title: "Comprovação Clínica",
    description: "Fórmula desenvolvida e testada por veterinários dermatologistas.",
    icon: "🔬",
    colSpan: "col-span-1",
  },
  {
    title: "Foco na Raiz",
    description: "Tratamos a causa das alergias de dentro para fora, melhorando a imunidade e a barreira cutânea.",
    icon: "🎯",
    colSpan: "col-span-1 md:col-span-2",
  },
];

export default function Sobre() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // State for interactive ingredients section
  const [activeIngredient, setActiveIngredient] = useState(0);

  const ingredients = [
    { title: "Ômega 3 Puro", desc: "Extraído de águas profundas, age implacavelmente contra inflamações celulares.", img: "/images/product-gummy.png" },
    { title: "Biotina Ativa", desc: "Reconstrói a queratina danificada, devolvendo brilho e espessura à pelagem.", img: "/images/dog-closeup.png" },
    { title: "Zinco Quelatado", desc: "A base biológica para a rápida cicatrização de feridas e hot spots.", img: "/images/hero-dog.png" },
    { title: "Vitamina E D-Alpha", desc: "O escudo antioxidante natural que previne o envelhecimento celular precoce.", img: "/images/pet-fashion.png" }
  ];

  return (
    <Layout>
      <div ref={containerRef} className="relative bg-supetz-bg">
        {/* Dynamic Hero */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 pointer-events-none -z-10"
          >
            {/* Immersive Parallax Background */}
            <div className="absolute inset-0 bg-supetz-bg/80 backdrop-blur-sm z-10" />
            <img
              src="/images/pet-group.png"
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover object-top opacity-40 grayscale mix-blend-multiply"
            />
            {/* Ambient Lighting */}
            <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-supetz-orange/15 rounded-full blur-[120px] z-20" />
            <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-supetz-orange/10 rounded-full blur-[100px] z-20" />
          </motion.div>

          <div className="max-w-5xl mx-auto w-full text-center relative z-30">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
              className="flex flex-col items-center"
            >
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-supetz-orange mb-8 flex items-center gap-4">
                <span className="w-12 h-[2px] bg-supetz-orange/50"></span>
                Nossa Essência
                <span className="w-12 h-[2px] bg-supetz-orange/50"></span>
              </span>

              <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-supetz-text leading-[0.9] tracking-[-0.03em] uppercase mb-8">
                A Ciência do <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-supetz-orange to-supetz-orange-dark italic font-serif lowercase font-medium">
                  cuidado.
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-supetz-text/70 font-medium leading-relaxed max-w-3xl mx-auto border-l-2 border-r-2 border-supetz-orange/20 px-8 py-2">
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
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supetz-orange flex items-center gap-4 mb-4">
                <span className="w-8 h-[2px] bg-supetz-orange/50"></span> Princípios
              </span>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-supetz-text leading-[0.9] tracking-tight">
                Nossos <span className="text-supetz-orange italic font-serif">Valores.</span>
              </h2>
              <p className="mt-6 text-lg text-supetz-text/60 font-medium">
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
                  className="group flex flex-col md:flex-row gap-6 md:gap-12 py-10 border-t border-supetz-text/10 hover:border-supetz-orange/30 transition-colors duration-500 first:border-0"
                >
                  <div className="text-5xl md:text-6xl font-black text-supetz-text/10 group-hover:text-supetz-orange/20 transition-colors duration-500 font-serif italic">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-supetz-text mb-3 tracking-tight group-hover:text-supetz-orange transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-supetz-text/65 leading-relaxed text-lg max-w-xl">
                      {val.description}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div className="border-t border-supetz-text/10 w-full" />
            </div>
          </div>
        </section>

        {/* Editorial Story (Sticky Scroll) */}
        <section className="py-32 bg-supetz-bg relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 md:gap-24 items-start">

            {/* Sticky Image Container */}
            <div className="lg:sticky lg:top-32 h-[50vh] lg:h-[75vh] w-full rounded-[3rem] overflow-hidden shadow-2xl shadow-supetz-orange/5">
              <img
                src="/images/lifestyle-dog.png"
                alt="História da Supetz"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Scrolling Narrative Content */}
            <div className="py-10 lg:py-32 space-y-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-extrabold text-supetz-text leading-[0.9] tracking-tight mb-8">
                  Como tudo <br />
                  <span className="text-supetz-orange italic font-serif">começou.</span>
                </h2>
                <p className="text-xl md:text-2xl text-supetz-text/70 leading-relaxed font-medium">
                  A dor de ver nossos próprios cães sofrendo com alergias contínuas foi o estopim. Após tentarmos inúmeros tratamentos sintéticos e pomadas caras, percebemos que a solução precisava vir da base celular.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8 }}
              >
                <h3 className="text-3xl font-bold text-supetz-text mb-6">O Falso Alívio</h3>
                <p className="text-lg md:text-xl text-supetz-text/65 leading-relaxed">
                  O mercado estava cheio de opções paliativas que mascaravam sintomas, mas geravam severos efeitos colaterais a longo prazo. Nós queríamos resolver a verdadeira raiz do problema: a restauração da barreira cutânea e a imunidade interna.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8 }}
                className="pb-32"
              >
                <h3 className="text-3xl font-bold text-supetz-text mb-6">A Fórmula Perfeita</h3>
                <p className="text-lg md:text-xl text-supetz-text/65 leading-relaxed">
                  O resultado foram anos de pesquisa profunda ao lado de veterinários dermatologistas, testando extratos naturais puros. Hoje, a Supetz orgulha-se de ajudar milhares de pets em todo o Brasil a viverem sua melhor vida, livres de sofrimento.
                </p>
              </motion.div>
            </div>

          </div>
        </section>

        {/* Ingredients Showcase */}
        <section className="py-24 md:py-40 px-6 bg-supetz-bg-alt/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24 items-center">

            {/* Left: Text & Interactive List */}
            <div className="w-full md:w-1/2">
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supetz-orange flex items-center gap-4 mb-4">
                <span className="w-8 h-[2px] bg-supetz-orange/50"></span> O Segredo
              </span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-supetz-text mb-12 tracking-tight">
                A pureza da <br />
                <span className="text-supetz-orange italic font-serif">Nossa Fórmula.</span>
              </h2>

              <div className="space-y-4">
                {ingredients.map((item, idx) => {
                  const isActive = activeIngredient === idx;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group cursor-pointer border-b border-supetz-text/10 pb-6 pt-4"
                      onMouseEnter={() => setActiveIngredient(idx)}
                      onClick={() => setActiveIngredient(idx)}
                    >
                      <h3 className={`text-2xl font-bold transition-colors duration-300 flex items-center justify-between ${isActive ? 'text-supetz-orange' : 'text-supetz-text group-hover:text-supetz-orange'}`}>
                        {item.title}
                        <span className={`transition-all duration-300 font-serif italic text-3xl ${isActive ? 'opacity-100 translate-x-0 text-supetz-orange' : 'opacity-0 -translate-x-4 text-supetz-orange group-hover:opacity-100 group-hover:translate-x-0'}`}>
                          →
                        </span>
                      </h3>
                      <div className={`grid transition-all duration-500 ease-in-out ${isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <p className="text-supetz-text/60 mt-4 text-lg max-w-md leading-relaxed pr-8">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Immersive Image Reveal */}
            <div className="w-full md:w-1/2 relative h-[500px] md:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl bg-supetz-text/5">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeIngredient}
                  src={ingredients[activeIngredient].img}
                  alt={ingredients[activeIngredient].title}
                  initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-supetz-orange/10 mix-blend-overlay pointer-events-none" />
            </div>

          </div>
        </section>

        {/* Call to Action */}
        <FinalCTASection />
      </div>
    </Layout>
  );
}
