import { motion } from "framer-motion";
import { CheckCircle2, Award } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export default function VetEndorsement() {
  return (
    <section className="py-24 bg-white relative overflow-hidden text-supet-text">
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-supet-bg-alt rounded-bl-full -z-10" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          
          {/* Left: Premium Portrait */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: motionTokens.easeOut }}
            className="relative mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-none"
          >
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-supet-orange/10 z-10 w-full">
              {/* Replace with a real high-quality vet photo */}
              <img 
                src="/images/vet-clinic.png" 
                alt="Dra. Amanda Silva - Médica Veterinária Dermatologista" 
                className="w-full h-full object-cover grayscale-[10%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8 text-white text-left">
                <p className="font-extrabold text-2xl">Dra. Amanda Silva</p>
                <p className="text-white/80 font-medium font-serif italic mb-1">Dermatologia Veterinária Avançada</p>
                <p className="text-xs uppercase tracking-widest text-white/50 font-bold">CRMV-SP 45.892</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Editorial Quote & Science */}
          <div className="flex flex-col justify-center items-center text-center lg:items-start lg:text-left">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center lg:justify-start gap-4 mb-6">
              <span className="w-8 h-[2px] bg-supet-orange/50 hidden lg:block"></span> Opinião Médica
            </span>
            
            <h2 className="text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1] tracking-tight mb-8 text-balance">
              "A verdadeira cura vem da <br />
              <span className="text-supet-orange italic font-serif">imunidade base.</span>"
            </h2>

            <div className="space-y-6 text-lg md:text-xl text-supet-text/70 leading-relaxed font-medium">
              <p data-speakable="true">
                A maioria das abordagens convencionais foca apenas em anestesiar a pele temporariamente. O problema retorna assim que o efeito da pomada ou do corticoide passa, colocando a saúde do animal em risco a longo prazo.
              </p>
              <p data-speakable="true">
                A fórmula da Supet age no <strong className="text-supet-text">epicentro da inflamação celular</strong>. A combinação exata de Ômega 3 superconcentrado, Zinco e Biotina não apenas interrompe a cascata inflamatória (o que causa a coceira), mas reconstrói fisicamente as barreiras de proteção da pele.
              </p>
            </div>

            <div className="mt-12 space-y-4 max-w-lg mx-auto lg:mx-0 text-left">
              {[
                "Ativos naturais que não sobrecarregam fígados ou rins.",
                "Eficácia clínica na interrupção de lambeduras e focos de vermelhidão.",
                "Resultados mais rápidos e duradouros pela via sistêmica."
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-base font-bold text-supet-text/80">{point}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
