import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  in: { opacity: 1, scale: 1, filter: "blur(0px)" },
  out: { opacity: 0, scale: 1.02, filter: "blur(4px)" },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}
