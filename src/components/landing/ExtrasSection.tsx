import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { useProductRatings } from "@/hooks/useProductRatings";
import { motionTokens } from "@/lib/motion";

const EXTRA_CATEGORIES = ["extra", "acessorio", "higiene", "brinquedo", "alimentacao"];

export default function ExtrasSection() {
    const { addItem } = useCart();
    const { products: extras, loading } = useProducts({ categories: EXTRA_CATEGORIES });
    const ratings = useProductRatings(extras.map(p => p.id));

    if (loading) return null;
    if (extras.length === 0) return null;

    return (
        <section className="relative py-24 md:py-40 bg-white border-t border-supet-text/5">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
                    <div>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-supet-orange flex items-center gap-4 mb-4">
                            <span className="w-8 h-[2px] bg-supet-orange/50"></span> Acessórios
                        </span>
                        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-supet-text leading-[0.9] tracking-tight text-balance">
                            A Coleção <br />
                            <span className="text-supet-orange italic font-serif">Essencial.</span>
                        </h2>
                    </div>
                    <p className="max-w-md text-lg text-supet-text/60 font-medium">
                        Itens de curadoria exclusiva desenhados para elevar a rotina e o bem-estar do seu pet.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                    {extras.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: i * 0.15, ease: motionTokens.easeOut }}
                            className="group flex flex-col"
                        >
                            {product.image && (
                                <div className="relative h-[320px] md:h-[400px] lg:h-[450px] w-full mb-8 rounded-[2.5rem] overflow-hidden bg-supet-bg">
                                    <motion.img
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.6, ease: motionTokens.easeOut }}
                                        src={product.image}
                                        alt={product.title}
                                        className="h-full w-full object-cover origin-center"
                                    />
                                    <div className="absolute inset-0 bg-supet-orange/5 mix-blend-overlay group-hover:bg-transparent transition-colors duration-500" />
                                </div>
                            )}

                            <div className="flex justify-between items-start gap-4">
                                <div>
                                <Link to={`/produto/${product.id}`} className="hover:opacity-80 transition-opacity">
                                    <h3 className="text-2xl font-extrabold text-supet-text tracking-tight group-hover:text-supet-orange transition-colors duration-300">
                                        {product.title}
                                    </h3>
                                </Link>
                                    <p className="mt-2 text-base text-supet-text/60 font-medium">
                                        {product.subtitle}
                                    </p>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-supet-text/40">R$</span>
                                        <span className="text-2xl font-black text-supet-text">
                                            {product.price.toFixed(2).replace(".", ",")}
                                        </span>
                                    </div>
                                    {product.originalPrice > product.price && (
                                        <p className="text-xs mt-1 line-through text-supet-text/30 font-medium">
                                            R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => addItem(product)}
                                    className="w-full flex items-center justify-between border-b border-supet-text/20 pb-4 text-sm font-black uppercase tracking-widest text-supet-text group-hover:border-supet-orange group-hover:text-supet-orange transition-colors duration-300"
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
