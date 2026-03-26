import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Beaker, ShieldCheck, Sparkles, Activity } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead, { buildBreadcrumbSchema, buildEducationalSchema } from "@/components/SEOHead";
import { motionTokens } from "@/lib/motion";

const ingredients = [
  {
    id: "omega3",
    name: "Ômega 3 Puro (EPA/DHA)",
    amount: "250mg",
    desc: "Extraído a frio das águas profundas. Atua como o principal agente no combate da inflamação celular, interrompendo a reação alérgica que causa a coceira constante.",
    icon: Activity
  },
  {
    id: "colageno",
    name: "Colágeno Peptídeo",
    amount: "500mg",
    desc: "Proteína de alta absorção que reconstrói fisicamente a barreira cutânea. Fechando os micro-ferimentos por onde entram as bactérias oportunistas.",
    icon: ShieldCheck
  },
  {
    id: "biotina",
    name: "Biotina Complex",
    amount: "2.5mg",
    desc: "A 'Vitamina do Pelo'. Essencial para o metabolismo de queratina, promovendo um crescimento de pelagem mais densa, forte e com brilho espelhado.",
    icon: Sparkles
  },
  {
    id: "zinco",
    name: "Zinco Quelato",
    amount: "15mg",
    desc: "Fundamental para a imunidade da pele e cicatrização rápida de dermatites, feridas e áreas com falha de pelo.",
    icon: Beaker
  }
];

export default function Ciencia() {
  return (
    <Layout>
      <SEOHead
        title="A Ciência por Trás da Supet"
        description="Descubra a fórmula científica Supet: Ômega 3, Colágeno, Biotina e Zinco Quelato. Desenvolvida por veterinários dermatologistas para tratar alergias e coceira de dentro para fora."
        path="/ciencia"
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", url: "https://supetz-playful-trust.lovable.app/" },
            { name: "Ciência", url: "https://supetz-playful-trust.lovable.app/ciencia" },
          ]),
          buildEducationalSchema({
            name: "A Ciência por Trás da Supet",
            description: "Fórmula científica com Ômega 3, Colágeno, Biotina e Zinco Quelato para tratar alergias e coceira em cães.",
            url: "https://supetz-playful-trust.lovable.app/ciencia",
            about: "Suplementos naturais para saúde dermatológica canina",
          }),
        ]}
      />
      <div className="bg-supet-bg min-h-screen pt-24 pb-20 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-supet-orange/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-[1200px] px-6 relative z-10">
          
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-6">
              <span className="w-8 h-[2px] bg-supet-orange/50"></span> A Fórmula Supet
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-supet-text tracking-tight uppercase leading-[0.9]">
              Ciência Aplicada <br />
              <span className="text-supet-orange italic font-serif lowercase">à Longevidade.</span>
            </h1>
            <p className="mt-6 text-xl text-supet-text/60 font-medium leading-relaxed">
              Não maquíamos sintomas. Nós formulamos a composição mais avançada do Brasil para tratar alergias, recuperar a pelagem e fortalecer a imunidade <strong className="text-supet-text">de dentro para fora.</strong>
            </p>
          </div>

          {/* Root Cause Approach */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="relative rounded-3xl overflow-hidden aspect-square border border-supet-text/10 shadow-2xl"
            >
              <img src="/images/pet-badboy.png" alt="Cão saudável" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="text-xs uppercase tracking-widest font-black text-supet-orange mb-2">O Segredo</p>
                  <p className="text-2xl font-bold leading-tight">Chega de pomadas que só aliviam por 2 horas.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center"
            >
               <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">O Fim da Cascata Inflamatória</h2>
               <div className="space-y-6 text-lg text-supet-text/70 font-medium">
                 <p>
                   Alergias, coceiras e falhas no pelo são apenas sintomas de um problema maior: uma barreira cutânea enfraquecida e um sistema imunológico em alerta constante.
                 </p>
                 <p>
                   Para criar as Gomas Supet, isolamos os 4 bioativos mais potentes comprovados por estudos clínicos veterinários. Eles trabalham em sinergia para não apenas 'desligar' o sinal da coceira, mas para fornecer os blocos de construção exatos que a pele precisa para se curar.
                 </p>
               </div>
               <div className="mt-8 pt-8 border-t border-supet-text/10 flex items-center gap-6">
                 <div>
                   <p className="text-4xl font-black text-supet-orange">99%</p>
                   <p className="text-xs font-bold uppercase tracking-widest text-supet-text/50">Palatabilidade</p>
                 </div>
                 <div>
                   <p className="text-4xl font-black text-supet-orange">0%</p>
                   <p className="text-xs font-bold uppercase tracking-widest text-supet-text/50">Corantes Artificiais</p>
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Ingredients Grid */}
          <div className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">A Tabela Nutricional Explicada</h2>
              <p className="text-supet-text/60 font-medium text-lg max-w-2xl mx-auto">Transparência total. Sem mistérios, sem ingredientes 'preenchedores' escondidos.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ingredients.map((ing, i) => (
                <motion.div 
                  key={ing.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] border border-supet-text/5 shadow-xl shadow-supet-text/5 hover:border-supet-orange/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-supet-bg rounded-2xl flex items-center justify-center group-hover:bg-supet-orange group-hover:text-white transition-colors">
                      <ing.icon className="w-7 h-7" />
                    </div>
                    <span className="bg-supet-orange/10 text-supet-orange text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">{ing.amount}/goma</span>
                  </div>
                  <h3 className="text-2xl font-extrabold mb-3">{ing.name}</h3>
                  <p className="text-supet-text/60 font-medium leading-relaxed">{ing.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-supet-text text-white rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center">
               <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Pronto para a transformação?</h2>
               <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">Sinta-se seguro com ingredientes apoiados pela ciência e resultados reais em milhares de cães em todo o Brasil.</p>
               <Link 
                 to="/shop"
                 className="bg-supet-orange hover:bg-supet-orange-dark text-white rounded-full px-12 py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-supet-orange/20 hover:scale-105 flex items-center justify-center gap-2"
               >
                 Ver Loja Online <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
