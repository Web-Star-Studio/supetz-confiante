import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { motionTokens } from "@/lib/motion";
import AnimatedSectionHeading from "@/components/landing/AnimatedSectionHeading";

const actionSteps = [
  {
    step: "01",
    title: "Base intestinal",
    text: "Nutre a base intestinal e imunologica para reduzir gatilhos.",
    tone: "bg-[#fff4e8] border-supet-orange/25",
  },
  {
    step: "02",
    title: "Controle de inflamacao",
    text: "Reduz irritacoes recorrentes e melhora o conforto da pele.",
    tone: "bg-white border-supet-text/15",
  },
  {
    step: "03",
    title: "Reconstrucao da pele",
    text: "Reforca a barreira cutanea e fortalece a pelagem.",
    tone: "bg-[#fff9f2] border-supet-orange/25",
  },
];

const ingredients = [
  {
    title: "Tripla absorcao nutricional",
    description: "Maior eficiencia na absorcao dos nutrientes.",
    tag: "Absorcao",
    position: "left-[7%] top-[8%]",
    orbitX: -314,
    orbitY: -220,
  },
  {
    title: "Colageno tipo 2",
    description: "Ajuda na reconstrucao da pele e da pelagem.",
    tag: "Estrutura",
    position: "right-[7%] top-[10%]",
    orbitX: 316,
    orbitY: -206,
  },
  {
    title: "Biotina",
    description: "Fortalece os pelos e recupera a barreira da pele.",
    tag: "Pelagem",
    position: "left-[2%] top-[39%]",
    orbitX: -364,
    orbitY: -12,
  },
  {
    title: "Vitamina E",
    description: "Auxilia na regeneracao celular e reduz inflamacoes.",
    tag: "Reparo",
    position: "right-[4%] top-[41%]",
    orbitX: 366,
    orbitY: -4,
  },
  {
    title: "Probioticos",
    description: "Equilibram a saude intestinal e fortalecem a imunidade.",
    tag: "Imunidade",
    position: "left-[12%] bottom-[9%]",
    orbitX: -262,
    orbitY: 214,
  },
  {
    title: "Sabor irresistivel",
    description: "Facilita a aceitacao do pet no dia a dia.",
    tag: "Aceitacao",
    position: "right-[12%] bottom-[8%]",
    orbitX: 264,
    orbitY: 220,
  },
];

const dailyBenefits = [
  "Alivio das coceiras em poucos dias",
  "Pelagem mais bonita e saudavel",
  "Fortalecimento da imunidade",
  "Pele mais resistente contra alergias",
  "Formula natural sem dependencia quimica",
];

type Ingredient = (typeof ingredients)[number];

function rotatePoint(x: number, y: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function IngredientOrbitCard({
  item,
  index,
  orbitActive,
  orbitSweep,
}: {
  item: Ingredient;
  index: number;
  orbitActive: boolean;
  orbitSweep: number;
}) {
  const progress = useMotionValue(orbitActive ? 1 : 0);

  useEffect(() => {
    if (!orbitActive) return;

    const controls = animate(progress, 1, {
      duration: 0.92 + index * 0.05,
      delay: 0.03 + index * 0.04,
      ease: motionTokens.easeOut,
    });

    return () => controls.stop();
  }, [index, orbitActive, progress]);

  const opacity = useTransform(progress, [0, 0.1, 1], [0, 1, 1]);
  const scale = useTransform(progress, [0, 0.78, 1], [0.9, 1.02, 1]);
  const rotate = useTransform(progress, [0, 1], [-4.5, 0]);
  const blur = useTransform(progress, [0, 1], [10, 0]);
  const saturate = useTransform(progress, [0, 1], [0.88, 1]);
  const shadowY = useTransform(progress, [0, 1], [28, 16]);
  const shadowBlur = useTransform(progress, [0, 1], [40, 34]);
  const shadowOpacity = useTransform(progress, [0, 1], [0.18, 0.52]);
  const filter = useMotionTemplate`blur(${blur}px) saturate(${saturate})`;
  const boxShadow = useMotionTemplate`0 ${shadowY}px ${shadowBlur}px -24px rgba(55,35,10,${shadowOpacity})`;
  const x = useTransform(progress, (latest) => {
    const currentAngle = -orbitSweep * (1 - latest);
    const radiusScale = 1 + (1 - latest) * 0.045;
    const currentPoint = rotatePoint(item.orbitX * radiusScale, item.orbitY * radiusScale, currentAngle);

    return currentPoint.x - item.orbitX;
  });
  const y = useTransform(progress, (latest) => {
    const currentAngle = -orbitSweep * (1 - latest);
    const radiusScale = 1 + (1 - latest) * 0.045;
    const currentPoint = rotatePoint(item.orbitX * radiusScale, item.orbitY * radiusScale, currentAngle);

    return currentPoint.y - item.orbitY;
  });

  return (
    <motion.article
      style={{ opacity, scale, rotate, x, y, filter, boxShadow, willChange: "transform, opacity, filter" }}
      className={`absolute w-[220px] rounded-[1.3rem_1.8rem_1.4rem_1.6rem] border border-supet-orange/20 bg-white/95 p-4 shadow-[0_16px_34px_-24px_rgba(55,35,10,0.52)] ${item.position}`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supet-orange">{item.tag}</p>
      <p className="mt-1 text-lg font-extrabold leading-tight text-supet-text">{item.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-supet-text/70">{item.description}</p>
    </motion.article>
  );
}

export default function NaturalTreatmentSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbitActive = useInView(sectionRef, { once: true, amount: 0.16 });
  const orbitSweep = 26;

  return (
    <section ref={sectionRef} id="tratamento-natural" className="relative overflow-hidden bg-supet-bg py-20 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-supet-orange/14 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full bg-supet-orange/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <AnimatedSectionHeading
            eyebrow="Tratamento natural Supet"
            lines={["Conheca o tratamento", "natural Supet"]}
            accentLines={[1]}
            lineLayout="stacked"
            align="center"
            size="lg"
            className="mx-auto max-w-[36rem]"
          />
          <p className="mt-4 text-sm leading-relaxed text-supet-text/70 md:text-base">
            Supet foi desenvolvido com uma combinacao de nutrientes essenciais que ajudam a restaurar a saude da pele
            e fortalecer o organismo do pet.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {actionSteps.map((item, index) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationFast, delay: index * 0.08, ease: motionTokens.easeOut }}
              className={`relative rounded-[1.4rem_1rem_1.6rem_1.1rem] border p-4 text-left shadow-[0_16px_30px_-24px_rgba(55,35,10,0.52)] ${item.tone}`}
            >
              <span className="mb-2 inline-flex rounded-full bg-supet-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                Etapa {item.step}
              </span>
              <p className="text-sm font-extrabold text-supet-text">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-supet-text/75">{item.text}</p>
            </motion.article>
          ))}
        </div>

        <div className="relative mt-12 hidden h-[640px] lg:block">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-supet-orange/30" />
          <motion.div
            initial={false}
            animate={
              orbitActive
                ? { scale: [0.965, 1.018, 1], opacity: [0, 0.22, 0.1] }
                : { scale: 0.965, opacity: 0 }
            }
            transition={{ duration: 0.95, ease: motionTokens.easeOut }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[432px] w-[432px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-supet-orange/12 shadow-[0_0_0_1px_rgba(255,145,77,0.05),0_0_42px_rgba(255,145,77,0.14)]"
          />

          <motion.div
            style={{ x: "-50%", y: "-50%" }}
            animate={{
              y: ["-50%", "-51.5%", "-50%"],
              rotate: [0, 0.5, 0]
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] overflow-hidden rounded-full"
          >
            <img src="/images/product-bottle.png" alt="Produto Supet" className="h-full w-full object-contain" />
          </motion.div>

          {ingredients.map((item, index) => (
            <IngredientOrbitCard
              key={item.title}
              item={item}
              index={index}
              orbitActive={orbitActive}
              orbitSweep={orbitSweep}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-2 lg:hidden">
          {ingredients.map((item) => (
            <div key={item.title} className="border-l-4 border-supet-orange/60 bg-white/75 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supet-orange">{item.tag}</p>
              <p className="text-lg font-extrabold text-supet-text">{item.title}</p>
              <p className="text-sm leading-relaxed text-supet-text/72">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-supet-orange/20 bg-[#fff4e8] p-6 md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <AnimatedSectionHeading
                as="h3"
                lines={["O que acontece", "quando seu pet", "usa Supet diariamente"]}
                accentLines={[2]}
                lineLayout="alternate"
                size="md"
              />
              <p className="mt-3 text-sm leading-relaxed text-supet-text/70">
                O tratamento continuo pode evitar gastos com medicamentos e consultas recorrentes.
              </p>
            </div>

            <ul className="grid gap-2">
              {dailyBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 rounded-xl bg-white/85 px-3 py-2.5 text-sm font-semibold text-supet-text/80">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-supet-orange" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
