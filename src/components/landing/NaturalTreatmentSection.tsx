import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { motionTokens } from "@/lib/motion";
import AnimatedSectionHeading from "@/components/landing/AnimatedSectionHeading";

const actionSteps = [
  {
    step: "01",
    title: "Base intestinal",
    text: "Nutre a base intestinal e imunologica para reduzir gatilhos.",
    tone: "bg-[#fff4e8] border-supetz-orange/25",
  },
  {
    step: "02",
    title: "Controle de inflamacao",
    text: "Reduz irritacoes recorrentes e melhora o conforto da pele.",
    tone: "bg-white border-supetz-text/15",
  },
  {
    step: "03",
    title: "Reconstrucao da pele",
    text: "Reforca a barreira cutanea e fortalece a pelagem.",
    tone: "bg-[#fff9f2] border-supetz-orange/25",
  },
];

const ingredients = [
  {
    title: "Tripla absorcao nutricional",
    description: "Maior eficiencia na absorcao dos nutrientes.",
    tag: "Absorcao",
    position: "left-[7%] top-[8%]",
  },
  {
    title: "Colageno tipo 2",
    description: "Ajuda na reconstrucao da pele e da pelagem.",
    tag: "Estrutura",
    position: "right-[7%] top-[10%]",
  },
  {
    title: "Biotina",
    description: "Fortalece os pelos e recupera a barreira da pele.",
    tag: "Pelagem",
    position: "left-[2%] top-[39%]",
  },
  {
    title: "Vitamina E",
    description: "Auxilia na regeneracao celular e reduz inflamacoes.",
    tag: "Reparo",
    position: "right-[4%] top-[41%]",
  },
  {
    title: "Probioticos",
    description: "Equilibram a saude intestinal e fortalecem a imunidade.",
    tag: "Imunidade",
    position: "left-[12%] bottom-[9%]",
  },
  {
    title: "Sabor irresistivel",
    description: "Facilita a aceitacao do pet no dia a dia.",
    tag: "Aceitacao",
    position: "right-[12%] bottom-[8%]",
  },
];

const dailyBenefits = [
  "Alivio das coceiras em poucos dias",
  "Pelagem mais bonita e saudavel",
  "Fortalecimento da imunidade",
  "Pele mais resistente contra alergias",
  "Formula natural sem dependencia quimica",
];

export default function NaturalTreatmentSection() {
  return (
    <section id="tratamento-natural" className="relative overflow-hidden bg-supetz-bg py-20 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-supetz-orange/14 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full bg-supetz-orange/10 blur-3xl" />

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
            lines={["Conheca o", "tratamento", "natural Supet"]}
            accentLines={[2]}
            lineLayout="alternate"
            align="center"
            size="lg"
          />
          <p className="mt-4 text-sm leading-relaxed text-supetz-text/70 md:text-base">
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
              <span className="mb-2 inline-flex rounded-full bg-supetz-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                Etapa {item.step}
              </span>
              <p className="text-sm font-extrabold text-supetz-text">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-supetz-text/75">{item.text}</p>
            </motion.article>
          ))}
        </div>

        <div className="relative mt-12 hidden h-[640px] lg:block">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-supetz-orange/30" />

          <motion.div
            style={{ x: "-50%", y: "-50%" }}
            animate={{
              y: ["-50%", "-51.5%", "-50%"],
              rotate: [0, 0.5, 0]
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-[320px] w-[320px] overflow-hidden rounded-full border-[10px] border-white bg-white shadow-[0_32px_58px_-28px_rgba(55,35,10,0.62)]"
          >
            <img src="/images/product-bottle.png" alt="Produto Supet" className="h-full w-full object-contain p-4" />
          </motion.div>

          {ingredients.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationFast, delay: 0.08 + index * 0.05, ease: motionTokens.easeOut }}
              animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
              className={`absolute w-[220px] rounded-[1.3rem_1.8rem_1.4rem_1.6rem] border border-supetz-orange/20 bg-white/95 p-4 shadow-[0_16px_34px_-24px_rgba(55,35,10,0.52)] ${item.position}`}
              style={{ transitionDuration: `${6.5 + index * 0.4}s` }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supetz-orange">{item.tag}</p>
              <p className="mt-1 text-lg font-extrabold leading-tight text-supetz-text">{item.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-supetz-text/70">{item.description}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 grid gap-2 lg:hidden">
          {ingredients.map((item) => (
            <div key={item.title} className="border-l-4 border-supetz-orange/60 bg-white/75 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-supetz-orange">{item.tag}</p>
              <p className="text-lg font-extrabold text-supetz-text">{item.title}</p>
              <p className="text-sm leading-relaxed text-supetz-text/72">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-supetz-orange/20 bg-[#fff4e8] p-6 md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <AnimatedSectionHeading
                as="h3"
                lines={["O que acontece", "quando seu pet", "usa Supet diariamente"]}
                accentLines={[2]}
                lineLayout="alternate"
                size="md"
              />
              <p className="mt-3 text-sm leading-relaxed text-supetz-text/70">
                O tratamento continuo pode evitar gastos com medicamentos e consultas recorrentes.
              </p>
            </div>

            <ul className="grid gap-2">
              {dailyBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 rounded-xl bg-white/85 px-3 py-2.5 text-sm font-semibold text-supetz-text/80">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-supetz-orange" />
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
