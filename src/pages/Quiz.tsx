import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/context/CartContext";
import { products } from "@/services/mockData";

type QuizState = {
  petName: string;
  weight: string;
  mainIssue: string[];
};

const STEPS = [
  { id: "intro", title: "Vamos conhecer seu melhor amigo?" },
  { id: "name", title: "Qual o nome do seu pet?" },
  { id: "weight", title: "Qual o porte dele?" },
  { id: "issues", title: "O que mais incomoda ele hoje?" },
  { id: "result", title: "Plano Personalizado Supet" }
];

export default function Quiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuizState>({ petName: "", weight: "", mainIssue: [] });
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const toggleIssue = (issue: string) => {
    setData(prev => {
      const issues = prev.mainIssue.includes(issue)
        ? prev.mainIssue.filter(i => i !== issue)
        : [...prev.mainIssue, issue];
      return { ...prev, mainIssue: issues };
    });
  };

  const getRecommendation = () => {
    // Basic logic
    if (data.weight === "Grande (Acima de 25kg)" || data.mainIssue.length >= 2) {
      return products.find(p => p.id === "combo-3") || products[0];
    }
    if (data.weight === "Médio (11kg a 25kg)") {
       return products.find(p => p.id === "combo-2") || products[0];
    }
    return products.find(p => p.id === "combo-1") || products[0];
  };

  const recommendation = getRecommendation();

  return (
    <Layout hideHeader>
      <div className="min-h-screen bg-supet-bg flex flex-col relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-supet-text/5 fixed top-0 left-0 z-50">
          <motion.div 
            className="h-full bg-supet-orange" 
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Back Button */}
        {currentStep < STEPS.length - 1 && (
          <button 
            onClick={currentStep === 0 ? () => navigate(-1) : handleBack}
            className="absolute top-8 left-6 md:left-12 z-40 flex items-center gap-2 text-supet-text/50 hover:text-supet-orange transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto relative z-10">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 0: INTRO */}
            {currentStep === 0 && (
              <motion.div
                key="step-intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center w-full"
              >
                <div className="w-24 h-24 bg-supet-orange/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-10 h-10 text-supet-orange" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-supet-text tracking-tight mb-4 uppercase">
                  Plano de <br />
                  <span className="text-supet-orange italic font-serif lowercase">Saúde Supet</span>
                </h1>
                <p className="text-supet-text/60 font-medium mb-12 max-w-md mx-auto">
                  Responda 3 perguntas rápidas e descubra o protocolo exato para transformar a saúde do seu pet em 30 dias.
                </p>
                <button
                  onClick={handleNext}
                  className="bg-supet-orange hover:bg-supet-orange-dark text-white rounded-full px-12 py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-supet-orange/20 hover:scale-105 flex items-center justify-center gap-2 mx-auto w-full md:w-auto"
                >
                  Começar Agora <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 1: NAME */}
            {currentStep === 1 && (
              <motion.div
                key="step-name"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full"
              >
                <h2 className="text-3xl md:text-4xl font-extrabold text-supet-text mb-8">{STEPS[1].title}</h2>
                <input 
                  type="text"
                  value={data.petName}
                  onChange={(e) => setData({...data, petName: e.target.value})}
                  placeholder="Ex: Thor, Mel, Bob..."
                  className="w-full text-2xl bg-white border-2 border-supet-text/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-supet-orange transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleNext}
                  disabled={!data.petName.trim()}
                  className="mt-8 bg-supet-text disabled:bg-supet-text/20 disabled:cursor-not-allowed hover:bg-supet-orange text-white rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: WEIGHT */}
            {currentStep === 2 && (
              <motion.div
                key="step-weight"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full"
              >
                <h2 className="text-3xl md:text-4xl font-extrabold text-supet-text mb-2">{STEPS[2].title}</h2>
                <p className="text-supet-text/50 mb-8 font-medium">Isso ajuda a calcular a dosagem diária exata.</p>
                
                <div className="space-y-4">
                  {["Pequeno (Até 10kg)", "Médio (11kg a 25kg)", "Grande (Acima de 25kg)"].map(weight => (
                    <button
                      key={weight}
                      onClick={() => {
                        setData({...data, weight});
                        setTimeout(handleNext, 300); // Auto-advance
                      }}
                      className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                        data.weight === weight 
                          ? "border-supet-orange bg-supet-orange/5 text-supet-orange font-bold" 
                          : "border-supet-text/10 bg-white text-supet-text/70 hover:border-supet-text/30"
                      }`}
                    >
                      <span className="text-lg">{weight}</span>
                      {data.weight === weight && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: ISSUES */}
            {currentStep === 3 && (
              <motion.div
                key="step-issues"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full"
              >
                <h2 className="text-3xl md:text-4xl font-extrabold text-supet-text mb-2 line-clamp-2">O que o {data.petName || 'seu pet'} mais precisa hoje?</h2>
                <p className="text-supet-text/50 mb-8 font-medium">Selecione todos que se aplicam.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    "Coceira Constante", "Queda de Pelo excessiva", 
                    "Lambedura nas patas", "Pele avermelhada/feridas",
                    "Falta de energia", "Dificuldade ao se levantar"
                  ].map(issue => {
                    const isSelected = data.mainIssue.includes(issue);
                    return (
                      <button
                        key={issue}
                        onClick={() => toggleIssue(issue)}
                        className={`text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          isSelected 
                            ? "border-supet-orange bg-supet-orange/5 text-supet-orange" 
                            : "border-supet-text/10 bg-white text-supet-text/70 hover:border-supet-text/30"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${isSelected ? 'bg-supet-orange border-supet-orange' : 'border-supet-text/20'}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`font-medium ${isSelected ? 'font-bold' : ''}`}>{issue}</span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={data.mainIssue.length === 0}
                  className="bg-supet-orange disabled:bg-supet-text/20 disabled:cursor-not-allowed hover:bg-supet-orange-dark text-white rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2"
                >
                  Ver Meu Plano <Sparkles className="w-4 h-4 ml-1" />
                </button>
              </motion.div>
            )}

            {/* STEP 4: RESULTS */}
            {currentStep === 4 && (
              <motion.div
                key="step-result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                    <CheckCircle className="w-4 h-4" /> Análise Concluída
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-supet-text tracking-tight uppercase">
                    Plano Perfeito para <br />
                    <span className="text-supet-orange italic font-serif lowercase">{data.petName}</span>
                  </h2>
                </div>

                <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl border border-supet-text/5 flex flex-col md:flex-row gap-10">
                  
                  {/* Summary */}
                  <div className="md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                       <Activity className="text-supet-orange w-5 h-5" /> Foco do Tratamento
                    </h3>
                    <ul className="space-y-4 mb-8">
                      {data.mainIssue.slice(0, 3).map((issue, i) => (
                        <li key={i} className="flex items-start gap-3 text-supet-text/70 font-medium">
                          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          Combater {issue.toLowerCase()}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="bg-supet-bg p-6 rounded-2xl border border-supet-orange/20">
                      <p className="text-sm text-supet-text/60 font-bold uppercase tracking-widest mb-1">Dosagem Recomendada</p>
                      <p className="text-2xl font-black text-supet-text">
                        {data.weight === "Grande (Acima de 25kg)" ? "3 gomas/dia" : data.weight === "Médio (11kg a 25kg)" ? "2 gomas/dia" : "1 goma/dia"}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="md:w-1/2 bg-supet-bg-alt rounded-3xl p-8 border border-supet-text/5 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-supet-orange/10 rounded-full blur-2xl" />
                    
                    <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 z-10">Melhor Custo x Benefício</span>
                    
                    <img src={recommendation.image} alt={recommendation.title} className="w-32 h-32 object-contain drop-shadow-xl mb-4 z-10" />
                    <h4 className="text-2xl font-black text-supet-text z-10">{recommendation.title}</h4>
                    <p className="text-supet-text/60 font-medium mb-6 z-10">{recommendation.subtitle}</p>
                    
                    <div className="text-3xl font-black text-supet-orange mb-6 z-10">
                      R$ {recommendation.price.toFixed(2).replace('.', ',')}
                    </div>

                    <button
                      onClick={() => {
                        addItem(recommendation);
                        // Optional: Navigate to checkout or open drawer
                      }}
                      className="w-full bg-supet-orange hover:bg-supet-orange-dark text-white rounded-full py-4 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-supet-orange/20 z-10"
                    >
                      Iniciar Tratamento
                    </button>
                  </div>

                </div>
                
                <div className="mt-8 text-center text-supet-text/40 font-medium text-sm">
                  <button onClick={() => navigate("/")} className="hover:text-supet-text transition-colors underline">
                    Voltar para o início
                  </button>
                </div>

              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
// Helper missing icon
function CheckCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
}
