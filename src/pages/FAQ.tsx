import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import Layout from "@/components/layout/Layout";
import FinalCTASection from "@/components/landing/FinalCTASection";

const faqs = [
  {
    category: "Sobre o Produto",
    questions: [
      {
        q: "O que é o Supet e para que serve?",
        a: "Supet é um suplemento natural em formato de goma, desenvolvido por veterinários dermatologistas. Ele age de dentro para fora para acabar com coceiras, alergias, queda excessiva de pelo e vermelhidão, reconstruindo a imunidade e a barreira protetora da pele do seu cão."
      },
      {
        q: "Qual é a idade mínima para o meu cachorro começar a tomar?",
        a: "Supet é seguro para cães de todas as raças e tamanhos a partir dos 3 meses de idade. Para filhotes menores, recomendamos consultar o médico veterinário de sua confiança."
      },
      {
        q: "O Supet engorda?",
        a: "Não! Cada goma contém menos de 15 calorias e é livre de açúcares adicionados e gorduras ruins. Ele se encaixa perfeitamente na dieta diária do seu pet sem causar ganho de peso."
      }
    ]
  },
  {
    category: "Resultados & Uso",
    questions: [
      {
        q: "Em quanto tempo vejo resultados?",
        a: "A maioria dos tutores relata uma diminuição significativa na coceira e na vermelhidão logo nos primeiros 7 a 14 dias de uso contínuo. Para a reconstrução total da pelagem e cicatrização de feridas, o protocolo recomendado é de 60 a 90 dias."
      },
      {
        q: "Como devo oferecer o Supet ao meu cachorro?",
        a: "As gomas são super palatáveis, com sabor de carne de panela que os cães adoram! Você pode dar como petisco diário ou misturado na ração. A dosagem é baseada no peso: 1 goma até 10kg, 2 gomas de 11 a 25kg, e 3 gomas acima de 25kg."
      },
      {
        q: "Posso dar o Supet junto com outros medicamentos?",
        a: "Sim. Por ser um suplemento 100% natural baseado em vitaminas e minerais (Ômega 3, Zinco, Biotina), o Supet não tem interações medicamentosas conhecidas com remédios alopáticos convencionais."
      }
    ]
  },
  {
    category: "Compra & Envio",
    questions: [
      {
        q: "É seguro comprar pelo site?",
        a: "Totalmente seguro. Utilizamos tecnologia de criptografia de ponta (SSL) e os pagamentos são processados pelas maiores e mais seguras plataformas financeiras do Brasil. Seus dados estão 100% protegidos."
      },
      {
        q: "Qual o prazo de entrega?",
        a: "Nosso prazo médio de entrega é de 3 a 7 dias úteis para as regiões Sul e Sudeste, e de 5 a 12 dias úteis para as demais regiões do Brasil. Você receberá o código de rastreio no seu WhatsApp e e-mail."
      },
      {
        q: "E se o meu cachorro não gostar ou não der resultado?",
        a: "Temos o Desafio Supet 30 Dias. Se em 30 dias de uso correto você não notar melhoras na pele e na pelagem do seu cão, ou se ele não se adaptar ao sabor, nós devolvemos 100% do seu dinheiro. Sem burocracia."
      }
    ]
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <Layout>
      <div className="bg-supet-bg min-h-screen">
        
        {/* Header Section */}
        <section className="pt-32 pb-20 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-supet-orange/10 rounded-full blur-[100px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f3aa2f]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-8"
            >
              <MessageCircleQuestion className="w-8 h-8 text-supet-orange" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-supet-text tracking-tight uppercase mb-6"
            >
              Dúvidas <span className="text-supet-orange italic font-serif lowercase">Frequentes</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-supet-text/60 font-medium max-w-2xl mx-auto"
            >
              Tudo o que você precisa saber sobre como o Supet vai transformar a vida do seu melhor amigo.
            </motion.p>
          </div>
        </section>

        {/* FAQ Accordions */}
        <section className="pb-32 px-6">
          <div className="max-w-3xl mx-auto space-y-16">
            
            {faqs.map((category, catIdx) => (
              <motion.div 
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.1 }}
              >
                <h2 className="text-2xl font-black text-supet-text mb-6 flex items-center gap-4">
                  <span className="w-8 h-[2px] bg-supet-orange"></span>
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((item, qIdx) => {
                    const id = `${catIdx}-${qIdx}`;
                    const isOpen = openIndex === id;

                    return (
                      <div 
                        key={id} 
                        className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isOpen ? 'border-supet-orange shadow-lg shadow-supet-orange/5' : 'border-supet-text/10 hover:border-supet-orange/30'
                        }`}
                      >
                        <button
                          onClick={() => toggleFAQ(id)}
                          className="w-full text-left px-6 py-6 flex items-center justify-between gap-6"
                        >
                          <span className={`text-lg font-bold pr-8 transition-colors ${isOpen ? 'text-supet-orange' : 'text-supet-text'}`}>
                            {item.q}
                          </span>
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-supet-orange text-white' : 'bg-supet-bg text-supet-text'}`}>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-6 pt-0 text-supet-text/65 leading-relaxed text-lg font-medium border-t border-supet-text/5 mt-2 pt-4">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

          </div>
        </section>

        {/* Bottom CTA */}
        <FinalCTASection />
      </div>
    </Layout>
  );
}
