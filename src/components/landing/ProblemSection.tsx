import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const symptoms = [
  "Coceiras constantes",
  "Lamber as patas frequentemente",
  "Queda excessiva de pelos",
  "Mau cheiro nas orelhas",
  "Comer grama com frequencia",
  "Esfregar o bumbum no chao",
];

const effects = ["O sistema imunologico enfraquece", "Surgem alergias recorrentes", "A barreira da pele fica fragilizada"];

export default function ProblemSection() {
  return (
    <section id="problema" className="relative overflow-hidden bg-supetz-bg-alt py-20 md:py-24">
      <div className="pointer-events-none absolute left-0 top-10 h-52 w-52 rounded-full bg-supetz-orange/15 blur-3xl" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            className="supet-soft-panel p-7 md:p-9"
          >
            <h2 className="text-3xl font-extrabold leading-tight text-supetz-text md:text-4xl">
              Seu pet sofre com algum desses sintomas?
            </h2>
            <ul className="mt-6 space-y-3">
              {symptoms.map((symptom) => (
                <li key={symptom} className="flex items-start gap-3 rounded-2xl border border-supetz-text/10 bg-white/80 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-supetz-orange" aria-hidden="true" />
                  <span className="text-sm font-semibold text-supetz-text/75 md:text-base">{symptom}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-supetz-text/70 md:text-base">
              Esses sintomas normalmente indicam problemas de pele e desequilibrio na saude intestinal do pet.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: motionTokens.durationBase, delay: 0.06, ease: motionTokens.easeOut }}
            className="supet-soft-panel p-7 md:p-9"
          >
            <h3 className="text-3xl font-extrabold leading-tight text-supetz-text md:text-4xl">
              Por que muitos tratamentos nao funcionam?
            </h3>
            <p className="mt-5 text-sm leading-relaxed text-supetz-text/70 md:text-base">
              A maioria dos tratamentos trata apenas os sintomas, mas nao resolve a causa do problema. Grande parte
              das alergias e inflamacoes em pets comeca no desequilibrio da saude intestinal e imunologica, que acaba
              afetando diretamente a pele.
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-supetz-orange">Quando isso acontece:</p>
            <ul className="mt-3 space-y-2">
              {effects.map((effect) => (
                <li key={effect} className="text-sm font-semibold text-supetz-text/75 md:text-base">
                  {effect}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-supetz-text/70 md:text-base">
              Por isso o problema volta repetidamente. Supet atua de dentro para fora, ajudando a restaurar o
              equilibrio do organismo do seu pet.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
