import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";

export default function ScientificEfficacySection() {
    return (
        <section className="relative py-24 md:py-32 bg-white border-t border-supet-text/5 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Massive Typographical Data Viz Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: motionTokens.easeOut }}
                        className="flex flex-col gap-12"
                    >
                        <div>
                            <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center gap-4 mb-4">
                                <span className="w-8 h-[2px] bg-supet-orange/50"></span> A Causa e a Cura
                            </span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-supet-text leading-tight tracking-tight mt-6">
                                Resultados comprovados em até <span className="text-transparent bg-clip-text bg-gradient-to-r from-supet-orange to-supet-orange-dark italic font-serif">28 dias.</span>
                            </h2>
                            <p className="mt-6 text-lg text-supet-text/60 font-medium leading-relaxed">
                                Nossas fórmulas passam por rigorosos testes veterinários para garantir a maior taxa de absorção celular do mercado pet.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 pt-8 border-t border-supet-text/10">
                            <div className="flex flex-col">
                                <span className="text-5xl md:text-6xl font-black text-supet-orange tracking-tighter mix-blend-multiply">94%</span>
                                <span className="mt-2 text-sm font-bold uppercase tracking-widest text-supet-text/80">
                                    Pele
                                </span>
                                <p className="mt-1 text-sm text-supet-text/50">Redução na coceira</p>
                            </div>

                            <div className="h-full w-px bg-supet-text/10 hidden sm:block"></div>

                            <div className="flex flex-col">
                                <span className="text-5xl md:text-6xl font-black text-supet-orange tracking-tighter mix-blend-multiply">88%</span>
                                <span className="mt-2 text-sm font-bold uppercase tracking-widest text-supet-text/80">
                                    Pelagem
                                </span>
                                <p className="mt-1 text-sm text-supet-text/50">Aumento do brilho</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Editorial Imagery Right - CSS Composite */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, delay: 0.2, ease: motionTokens.easeOut }}
                        className="relative h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden bg-supet-bg flex items-center justify-center shadow-2xl"
                    >
                        {/* Natural Lifestyle Background */}
                        <img
                            src="/images/lifestyle-dog.png"
                            alt="Cachorro em ambiente doméstico"
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                        />

                        {/* Cozy Color Grade Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5A2B]/40 to-transparent mix-blend-multiply pointer-events-none"></div>
                        <div className="absolute inset-0 bg-supet-orange/10 mix-blend-overlay pointer-events-none"></div>

                        {/* Real Product Floating over Background */}
                        <motion.img
                            initial={{ y: 20 }}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            src="/hero-assets/pote.png"
                            alt="Pote Supet Original"
                            className="relative z-10 w-[55%] md:w-[65%] max-w-[280px] drop-shadow-[0_40px_40px_rgba(0,0,0,0.5)]"
                        />

                        {/* Reflection/Ground Shadow effect */}
                        <div className="absolute bottom-1/4 w-[50%] h-8 bg-black/40 blur-2xl rounded-[100%] pointer-events-none transform translate-y-[4.5rem]"></div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
