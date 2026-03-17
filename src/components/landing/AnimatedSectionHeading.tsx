import type { ElementType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motionTokens } from "@/lib/motion";
import { cn } from "@/lib/utils";

type HeadingSize = "md" | "lg" | "xl";

interface AnimatedSectionHeadingProps {
  lines: string[];
  eyebrow?: string;
  accentLines?: number[];
  align?: "left" | "center";
  lineLayout?: "stacked" | "alternate";
  size?: HeadingSize;
  as?: ElementType;
  uppercase?: boolean;
  className?: string;
}

const sizeClasses: Record<HeadingSize, string> = {
  md: "text-2xl md:text-4xl",
  lg: "text-3xl md:text-5xl",
  xl: "text-4xl md:text-6xl",
};

export default function AnimatedSectionHeading({
  lines,
  eyebrow,
  accentLines = [],
  align = "left",
  lineLayout = "stacked",
  size = "lg",
  as: HeadingTag = "h2",
  uppercase = false,
  className,
}: AnimatedSectionHeadingProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
      className={cn(align === "center" ? "text-center" : "text-left", className)}
    >
      {eyebrow ? (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationFast, ease: motionTokens.easeOut }}
          className="inline-block text-xs font-black uppercase tracking-[0.26em] text-supet-orange"
        >
          {eyebrow}
        </motion.span>
      ) : null}

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: eyebrow ? 0.08 : 0.02,
            },
          },
        }}
      >
        <HeadingTag
          className={cn(
            "mt-3 font-display font-extrabold leading-[0.9] tracking-[-0.028em] text-supet-text",
            sizeClasses[size],
            uppercase ? "uppercase" : "",
            "flex flex-col",
            align === "center" ? "items-center text-center" : "items-start text-left"
          )}
        >
          {lines.map((line, index) => (
            <motion.span
              key={`${line}-${index}`}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 18,
                  rotate: lineLayout === "alternate" ? (index % 2 === 0 ? -1.5 : 1.5) : 0,
                  x:
                    lineLayout === "alternate"
                      ? index % 2 === 0
                        ? -30
                        : 30
                      : align === "left"
                        ? -8
                        : 0,
                },
                show: {
                  opacity: 1,
                  y: 0,
                  x: 0,
                  rotate: lineLayout === "alternate" ? (index % 2 === 0 ? -0.45 : 0.45) : 0,
                  transition: { duration: motionTokens.durationBase, ease: motionTokens.easeOut },
                },
              }}
              animate={
                reduceMotion
                  ? undefined
                  : accentLines.includes(index)
                    ? { y: [0, -3, 0] }
                    : undefined
              }
              transition={
                reduceMotion
                  ? undefined
                  : accentLines.includes(index)
                    ? { duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                    : undefined
              }
              className={cn(
                "max-w-full",
                lineLayout === "alternate"
                  ? align === "center"
                    ? index % 2 === 0
                      ? "relative -left-3 md:-left-6"
                      : "relative left-3 md:left-6"
                    : index % 2 === 0
                      ? "relative -left-1 md:-left-2"
                      : "relative left-4 md:left-8"
                  : "block",
                accentLines.includes(index) ? "text-supet-orange" : "text-supet-text",
              )}
            >
              {line}
            </motion.span>
          ))}
        </HeadingTag>
      </motion.div>

      <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: align === "center" ? "8rem" : "6rem", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: motionTokens.durationBase, delay: 0.2, ease: motionTokens.easeOut }}
        animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
        className={cn(
          "mt-4 h-[3px] rounded-full bg-supet-orange/75",
          align === "center" ? "mx-auto" : "mx-0",
        )}
      />
    </motion.div>
  );
}
