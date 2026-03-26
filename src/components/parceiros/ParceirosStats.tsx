import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const stats = [
  { value: "500+", label: "Parceiros ativos" },
  { value: "R$ 2M+", label: "Em comissões pagas" },
  { value: "15%", label: "Comissão por venda" },
  { value: "24h", label: "Aprovação rápida" },
];

export default function ParceirosStats() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
              className="rounded-3xl bg-primary/5 p-6 md:p-8 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-primary">{stat.value}</p>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
