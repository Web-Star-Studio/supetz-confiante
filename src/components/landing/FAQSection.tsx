import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div id="faq" className="supet-soft-panel h-full p-7 md:p-9">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-supet-text md:text-4xl text-balance">
          Perguntas <span className="text-supet-orange">frequentes</span>
        </h2>
      </div>

      <div className="space-y-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="overflow-hidden rounded-2xl border border-supet-text/10 bg-white/80"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-content-${faq.id}`}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-supet-bg"
              >
                <span className="pr-4 text-sm font-semibold text-supet-text md:text-base">{faq.question}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 shrink-0 text-supet-orange" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-content-${faq.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: motionTokens.durationFast }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-supet-text/65">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
