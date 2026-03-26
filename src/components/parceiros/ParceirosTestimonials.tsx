import { motion, type Transition } from "framer-motion";
import { Star } from "lucide-react";
import { motionTokens } from "@/lib/motion";

const ease = motionTokens.easeOut as [number, number, number, number];

const testimonials = [
  {
    name: "Camila Rodrigues",
    role: "Influenciadora Pet",
    instagram: "@camilapet",
    quote: "Desde que me tornei parceira da Supet, minha audiência adora as recomendações. Já ganhei mais de R$ 8.000 em comissões em apenas 4 meses!",
    earnings: "R$ 8.200+",
    avatar: "CR",
  },
  {
    name: "Dr. Felipe Andrade",
    role: "Veterinário",
    instagram: "@drfelipevet",
    quote: "Indico Supet para meus pacientes com total confiança. O programa de parceiros me permite recomendar algo que realmente funciona e ainda ser recompensado.",
    earnings: "R$ 12.500+",
    avatar: "FA",
  },
  {
    name: "Marina Santos",
    role: "Creator / Blog",
    instagram: "@marinasantospet",
    quote: "O painel é super intuitivo e acompanho tudo em tempo real. A equipe da Supet é incrível e sempre me ajuda com materiais de divulgação.",
    earnings: "R$ 5.800+",
    avatar: "MS",
  },
];

const cardVariants = {
  hidden: (i: number) => ({
    opacity: 0,
    y: 40,
    scale: 0.92,
  }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: motionTokens.durationBase,
      ease,
    },
  }),
};

export default function ParceirosTestimonials() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationFast, ease }}
          className="text-xs font-black uppercase tracking-[0.26em] text-primary text-center mb-4"
        >
          Depoimentos
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationFast, delay: 0.1, ease: motionTokens.easeOut as unknown as number[] }}
          className="text-center text-muted-foreground text-sm md:text-base mb-12 max-w-lg mx-auto"
        >
          Veja o que nossos parceiros estão dizendo
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="rounded-3xl bg-secondary/60 p-7 flex flex-col justify-between"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-6 flex-1">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-primary">{t.earnings}</p>
                  <p className="text-[10px] text-muted-foreground">em comissões</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
