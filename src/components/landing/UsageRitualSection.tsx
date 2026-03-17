import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const steps = [
    {
        num: "01",
        title: "A Dose",
        desc: "Ofereça a dosagem calculada pelo peso, sem precisar forçar ou amassar na ração. A textura mastigável resolve o stress.",
    },
    {
        num: "02",
        title: "A Aceitação",
        desc: "Saborizante de carne super premium. Seu pet vai enxergar o tratamento apenas como o melhor petisco do dia.",
    },
    {
        num: "03",
        title: "O Resultado",
        desc: "Nutrição constante resulta em imunidade alta. Uso diário constrói uma barreira defensiva contínua de dentro para fora.",
    }
];

export default function UsageRitualSection() {
    return (
        <section className="relative py-24 md:py-32 bg-supet-bg-alt border-t border-supet-text/5">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20 md:mb-32">
                    <div>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center gap-4 mb-4">
                            <span className="w-8 h-[2px] bg-supet-orange/50"></span> Como Utilizar
                        </span>
                        <h2 className="text-4xl md:text-6xl font-extrabold text-supet-text tracking-tight text-balance">
                            O Ritual de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-supet-orange to-supet-orange-dark italic font-serif">Cuidado.</span>
                        </h2>
                    </div>
                    <p className="max-w-md text-lg text-supet-text/60 font-medium pb-2 border-b border-supet-orange/20">
                        Esqueça os remédios empurrados à força. Desenvolvemos uma experiência livre de estresse.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: i * 0.2, ease: motionTokens.easeOut }}
                            className="relative group cursor-default"
                        >
                            {/* Massive background number */}
                            <div className="absolute -top-12 -left-4 text-[120px] font-black text-supet-text/[0.03] select-none group-hover:text-supet-orange/10 transition-colors duration-500">
                                {step.num}
                            </div>

                            <div className="relative z-10 pt-8 border-t-2 border-supet-text/10 group-hover:border-supet-orange/50 transition-colors duration-500">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-supet-bg text-xs font-black uppercase tracking-widest text-supet-orange mb-6 shadow-sm border border-supet-orange/10">
                                    Passo {step.num}
                                </span>
                                <h3 className="text-2xl font-extrabold text-supet-text mb-4 tracking-tight group-hover:text-supet-orange transition-colors duration-300">
                                    {step.title}
                                </h3>
                                <p className="text-lg text-supet-text/60 font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
