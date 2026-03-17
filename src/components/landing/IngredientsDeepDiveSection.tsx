import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

const ingredients = [
    {
        name: "Colágeno Peptídeo",
        mg: "500mg",
        description: "Restaura a elasticidade da pele e previne a queda dos fios desde a raiz.",
        image: "/images/product-ingredients.png",
    },
    {
        name: "Ômega 3 Puro",
        mg: "250mg",
        description: "Óleo de salmão filtrado que garante brilho extremo e reduz inflamações.",
        image: "/images/product-lifestyle.png",
    },
    {
        name: "Biotina Complex",
        mg: "50mcg",
        description: "A vitamina essencial para a síntese de queratina, fortalecendo as garras.",
        image: "/images/product-laboratory.png",
    }
];

export default function IngredientsDeepDiveSection() {
    return (
        <section className="relative py-24 md:py-32 bg-supet-bg overflow-hidden">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
                    <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center justify-center gap-4 mb-4">
                        <span className="w-8 h-[2px] bg-supet-orange/50"></span> A Fórmula <span className="w-8 h-[2px] bg-supet-orange/50"></span>
                    </span>
                    <h2 className="text-4xl md:text-6xl font-extrabold text-supet-text tracking-tight max-w-3xl">
                        Ciência exata em cada <span className="text-supet-orange italic font-serif">miligrama.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                    {ingredients.map((item, i) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: i * 0.2, ease: motionTokens.easeOut }}
                            className="group flex flex-col items-center text-center p-10 md:p-12 rounded-[3.5rem] bg-white border border-supet-text/5 hover:border-supet-orange/30 hover:shadow-2xl hover:shadow-supet-orange/10 transition-all duration-500 relative overflow-hidden"
                        >
                            {/* Elegant Accent Splash inside card */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-supet-orange/5 rounded-full blur-3xl group-hover:bg-supet-orange/15 transition-colors duration-700 pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

                            <div className="flex flex-col items-center relative z-10 w-full h-full justify-center">
                                <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-supet-orange to-supet-orange-dark mb-6 tracking-tighter drop-shadow-sm">{item.mg}</span>
                                <div className="w-12 h-[3px] bg-supet-orange/30 mb-8 rounded-full"></div>
                                <h3 className="text-2xl font-extrabold text-supet-text mb-4 tracking-tight group-hover:text-supet-orange transition-colors duration-300">{item.name}</h3>
                                <p className="text-base text-supet-text/60 font-medium leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Real Product Integration Abstract Background */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: motionTokens.easeOut }}
                    className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 opacity-[0.04] pointer-events-none z-0"
                >
                    <img src="/hero-assets/jar-open.png" alt="" className="w-[800px] max-w-none mix-blend-multiply" />
                </motion.div>
            </div>
        </section>
    );
}
