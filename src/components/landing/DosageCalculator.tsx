import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Scale, HeartPulse, ShieldCheck, Bone } from "lucide-react";

export default function DosageCalculator() {
  const [weight, setWeight] = useState(15);
  const [dosage, setDosage] = useState(2);
  const [daysPerJar, setDaysPerJar] = useState(15);

  // Logic calculation based on Supet's rules:
  // <= 10kg: 1 goma
  // 11kg - 25kg: 2 gomas
  // > 25kg: 3 gomas
  // Jar contains approx 30 gomas
  useEffect(() => {
    let newDosage = 1;
    if (weight > 10 && weight <= 25) {
      newDosage = 2;
    } else if (weight > 25) {
      newDosage = 3;
    }
    setDosage(newDosage);
    setDaysPerJar(Math.floor(30 / newDosage));
  }, [weight]);

  return (
    <section className="py-20 bg-supet-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-supet-orange/5 rounded-full blur-[100px] -z-10" />
      
      <div className="mx-auto max-w-4xl px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-4">
            <span className="w-8 h-[2px] bg-supet-orange/50"></span> Na medida certa
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-supet-text tracking-tight">
            Descubra a dosagem <br className="hidden md:block" />
            <span className="text-supet-orange italic font-serif">ideal pro seu pet</span>
          </h2>
          <p className="mt-4 text-supet-text/60 max-w-lg mx-auto font-medium">
            Deslize para informar o peso do seu cão e veja exatamente quantas gomas ele precisa por dia.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-supet-text/5 p-8 md:p-12 border border-supet-text/10">
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            {/* Left: Input Slider */}
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <div className="w-24 h-24 bg-supet-bg-alt rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-lg overflow-hidden relative">
                 <Scale className="w-10 h-10 text-supet-orange relative z-10" />
                 <div className="absolute inset-0 bg-gradient-to-tr from-supet-orange/20 to-transparent" />
              </div>
              
              <div className="text-5xl font-black text-supet-text mb-2">
                {weight} <span className="text-2xl text-supet-text/50">kg</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-supet-text/40 mb-8">Peso do seu cão</p>
              
              <div className="w-full px-4">
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={weight} 
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-3 bg-supet-text/10 rounded-lg appearance-none cursor-pointer accent-supet-orange"
                  style={{
                    background: `linear-gradient(to right, #FE6D00 ${(weight / 50) * 100}%, #f1f1f1 ${(weight / 50) * 100}%)`
                  }}
                />
                <div className="flex justify-between mt-2 text-xs font-bold text-supet-text/30">
                  <span>1 kg</span>
                  <span>50+ kg</span>
                </div>
              </div>
            </div>

            {/* Right: Results Display */}
            <div className="w-full md:w-1/2 bg-supet-bg p-8 rounded-2xl border border-supet-orange/10 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-supet-orange/10 rounded-full blur-2xl group-hover:bg-supet-orange/20 transition-colors duration-500" />
              
              <div className="relative z-10">
                <h3 className="text-lg font-extrabold text-supet-text mb-6 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-supet-orange" />
                  Plano Personalizado
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-supet-text/50 uppercase tracking-widest mb-1">Dose Diária</p>
                    <div className="text-4xl font-black text-supet-orange font-serif italic flex items-baseline gap-2">
                      {dosage} <span className="text-xl font-sans not-italic font-bold text-supet-text">goma{dosage > 1 ? 's' : ''}/dia</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-supet-text/10" />

                  <div>
                    <p className="text-sm font-bold text-supet-text/50 uppercase tracking-widest mb-1">Rendimento por Pote</p>
                    <div className="text-3xl font-black text-supet-text flex items-baseline gap-2">
                      {daysPerJar} <span className="text-lg font-bold text-supet-text/60">dias</span>
                    </div>
                    <p className="text-sm text-supet-text/60 mt-2">
                      1 poste rende exatamente {daysPerJar} dias para um cão de {weight}kg.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-supet-text/10 flex items-center justify-between text-xs font-bold text-supet-text/50">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Seguro</span>
                  <span className="flex items-center gap-1"><Bone className="w-4 h-4" /> Alta Palatabilidade</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
