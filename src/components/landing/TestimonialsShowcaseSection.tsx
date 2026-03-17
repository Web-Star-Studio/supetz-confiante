import { motion } from "framer-motion";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { motionTokens } from "@/lib/motion";

export default function TestimonialsShowcaseSection() {
  return (
    <section className="relative bg-supet-bg-alt py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="mb-7 text-center"
        >
          <span className="text-xs font-black uppercase tracking-[0.26em] text-supet-orange">Depoimentos</span>
        </motion.div>
        <TestimonialsSection />
      </div>
    </section>
  );
}
