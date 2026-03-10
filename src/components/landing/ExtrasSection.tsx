import { motion } from "framer-motion";
import { products } from "@/services/mockData";
import { useCart } from "@/context/CartContext";
import { motionTokens } from "@/lib/motion";

export default function ExtrasSection() {
    const { addItem } = useCart();
    const extras = products.filter(p => p.category === "extra");

    if (extras.length === 0) return null;

    return (
        <section className="relative py-24 md:py-40 bg-white border-t border-supetz-text/5">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
                    <div>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supetz-orange flex items-center gap-4 mb-4">
                            <span className="w-8 h-[2px] bg-supetz-orange/50"></span> Acessórios
                        </span>
                        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-supetz-text leading-[0.9] tracking-tight">
                            A Coleção <br />
                            <span className="text-supetz-orange italic font-serif">Essencial.</span>
                        </h2>
                    </div>
                    <p className="max-w-md text-lg text-supetz-text/60 font-medium">
                        Itens de curadoria exclusiva desenhados para elevar a rotina e o bem-estar do seu pet.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                    {extras.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: i * 0.15, ease: motionTokens.easeOut }}
                            className="group flex flex-col"
                        >
                            {product.image && (
                                <div className="relative h-[450px] w-full mb-8 rounded-[2.5rem] overflow-hidden bg-supetz-bg">
                                    <motion.img
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.6, ease: motionTokens.easeOut }}
                                        src={product.image}
                                        alt={product.title}
                                        className="h-full w-full object-cover origin-center"
                                    />
                                    <div className="absolute inset-0 bg-supetz-orange/5 mix-blend-overlay group-hover:bg-transparent transition-colors duration-500" />
                                </div>
                            )}

                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-supetz-text tracking-tight group-hover:text-supetz-orange transition-colors duration-300">
                                        {product.title}
                                    </h3>
                                    <p className="mt-2 text-base text-supetz-text/60 font-medium">
                                        {product.subtitle}
                                    </p>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-supetz-text/40">R$</span>
                                        <span className="text-2xl font-black text-supetz-text">
                                            {product.price.toFixed(2).replace(".", ",")}
                                        </span>
                                    </div>
                                    {product.originalPrice > product.price && (
                                        <p className="text-xs mt-1 line-through text-supetz-text/30 font-medium">
                                            R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => addItem(product)}
                                    className="w-full flex items-center justify-between border-b border-supetz-text/20 pb-4 text-sm font-black uppercase tracking-widest text-supetz-text group-hover:border-supetz-orange group-hover:text-supetz-orange transition-colors duration-300"
                                >
                                    <span>Adicionar à sacola</span>
                                    <span className="text-xl font-serif italic mb-1">+</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
