import { motion } from "framer-motion";
import { TrendingUp, Gift, Link2, Users } from "lucide-react";
import { motionTokens } from "@/lib/motion";

const benefits = [
  { icon: TrendingUp, title: "Comissão por Venda", desc: "Ganhe até 15% de comissão em cada venda realizada com seu cupom ou link." },
  { icon: Gift, title: "Cupom Exclusivo", desc: "Receba um cupom personalizado para oferecer desconto aos seus seguidores." },
  { icon: Link2, title: "Link Rastreável", desc: "Compartilhe seu link único e acompanhe cliques e conversões em tempo real." },
  { icon: Users, title: "Painel Completo", desc: "Acompanhe vendas, ganhos e saques pelo seu dashboard exclusivo." },
];

const cardVariants = {
  hidden: (i: number) => ({
    opacity: 0,
    y: 40,
    scale: 0.92,
    rotateX: 8,
    filter: "blur(6px)",
  }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.12,
      duration: motionTokens.durationBase,
      ease: motionTokens.easeOut,
    },
  }),
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -45 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.12 + 0.25,
      duration: motionTokens.durationFast,
      ease: [...motionTokens.easeOut] as number[],
      type: "spring" as const,
      stiffness: 260,
      damping: 18,
    },
  }),
};

const textVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.12 + 0.35,
      duration: motionTokens.durationFast,
      ease: motionTokens.easeOut,
    },
  }),
};

export default function ParceirosBenefits() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl px-6" style={{ perspective: "800px" }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
          className="text-xs font-black uppercase tracking-[0.26em] text-primary text-center mb-12"
        >
          Vantagens
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="rounded-3xl bg-secondary/60 p-7 md:p-8 cursor-default"
            >
              <motion.div
                custom={i}
                variants={iconVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"
              >
                <b.icon className="w-5 h-5 text-primary" />
              </motion.div>

              <motion.div
                custom={i}
                variants={textVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="font-bold text-foreground text-base mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
