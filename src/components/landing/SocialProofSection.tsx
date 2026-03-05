import { motion } from "framer-motion";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import { motionTokens } from "@/lib/motion";

export default function SocialProofSection() {
  return (
    <section className="relative bg-supetz-bg-alt py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <TestimonialsSection />
          <FAQSection />
        </motion.div>
      </div>
    </section>
  );
}
