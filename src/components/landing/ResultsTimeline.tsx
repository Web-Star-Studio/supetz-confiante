import { motion } from "framer-motion";
import { Clock, ShieldCheck, Sparkles, HeartPulse } from "lucide-react";
import { motionTokens } from "@/lib/motion";

const timelineEvents = [
  {
    day: "Dias 1 a 7",
    title: "Absorção & Alívio Inicial",
    description: "Os compostos bioativos começam a agir a nível celular. Você notará uma leve redução na intensidade das coceiras e lambeduras constantes.",
    icon: Clock,
  },
  {
    day: "Dias 15 a 21",
    title: "Restauração da Barreira",
    description: "A pele começa a cicatrizar. Vermelhidões e descamações diminuem significativamente à medida que a imunidade cutânea é fortalecida.",
    icon: ShieldCheck,
  },
  {
    day: "Dias 30 a 45",
    title: "Pelagem Nova e Brilhante",
    description: "O crescimento de pelos saudáveis é ativado. A pelagem fica visivelmente mais densa, macia e com brilho espelhado.",
    icon: Sparkles,
  },
  {
    day: "Mais de 60 Dias",
    title: "Saúde Integral e Prevenção",
    description: "O sistema imunológico atinge seu pico. As alergias tornam-se raras, articulações mais fortes e seu pet recupera a energia da juventude.",
    icon: HeartPulse,
  }
];

export default function ResultsTimeline() {
  return (
    <section className="py-24 bg-supet-bg relative overflow-hidden">
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-supet-orange/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#f3aa2f]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-4"
          >
            <span className="w-8 h-[2px] bg-supet-orange/50"></span> A Jornada
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-supet-text tracking-tight uppercase"
          >
            O que esperar nos <br />
            <span className="text-supet-orange italic font-serif lowercase">próximos meses.</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="mt-6 text-supet-text/60 max-w-2xl mx-auto font-medium"
          >
            A restauração celular não acontece da noite para o dia. Veja como a fórmula da Supet age de dentro para fora ao longo do tempo.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical Line Form Desktop */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-supet-orange/50 via-supet-orange/20 to-transparent -translate-x-1/2" />

          <div className="space-y-8 md:space-y-0">
            {timelineEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              const Icon = event.icon;

              return (
                <div key={event.day} className="relative flex flex-col md:flex-row items-center justify-between group">

                  {/* Left Content */}
                  <div className={`md:w-5/12 ${isEven ? 'md:text-right md:pr-12' : 'md:order-3 md:text-left md:pl-12'} md:mb-0 w-full`}>
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, ease: motionTokens.easeOut }}
                      className="bg-white p-8 rounded-[2rem] shadow-xl shadow-supet-text/5 border border-supet-text/5 hover:border-supet-orange/30 transition-colors duration-300 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 ${isEven ? 'right-0 -translate-x-1/2 translate-y-[-50%]' : 'left-0 translate-x-[-10%] translate-y-[-50%]'} w-32 h-32 bg-supet-orange/5 rounded-full blur-2xl group-hover:bg-supet-orange/10 transition-colors duration-500`} />
                      
                      <span className="inline-block px-3 py-1 bg-supet-orange/10 text-supet-orange font-black text-xs uppercase tracking-widest rounded-full mb-4">
                        {event.day}
                      </span>
                      <h3 className="text-2xl font-extrabold text-supet-text mb-3">{event.title}</h3>
                      <p className="text-supet-text/65 font-medium leading-relaxed">{event.description}</p>
                    </motion.div>
                  </div>

                  {/* Center Node */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-supet-orange items-center justify-center shadow-lg shadow-supet-orange/20 z-10">
                    <Icon className="w-5 h-5 text-supet-orange" />
                  </div>

                  {/* Empty space for balance */}
                  <div className={`hidden md:block md:w-5/12 ${isEven ? 'md:order-3' : 'md:order-1'}`} />

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
