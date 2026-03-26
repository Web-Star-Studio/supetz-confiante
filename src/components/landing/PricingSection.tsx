import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { Check } from "lucide-react";

export default function PricingSection() {
  const { addItem } = useCart();
  const { products, loading } = useProducts({ category: "combo" });
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAdd = (product: any) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  if (loading) {
    return (
      <section id="precos" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[2rem] p-8 bg-muted animate-pulse h-72" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section id="precos" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-supet-text text-balance">
            Escolha o melhor <span className="text-supet-orange">combo</span> para seu pet
          </h2>
          <p className="mt-4 text-supet-text/50 max-w-lg mx-auto">
            Quanto mais potes, maior o desconto. Frete grátis para todo o Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ scale: 1.02 }}
              className={`relative flex flex-col rounded-[2rem] p-8 ${product.highlighted
                ? "bg-supet-orange text-white ring-4 ring-supet-orange/30"
                : "bg-supet-bg-alt text-supet-text"
                }`}
            >
              {product.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold ${product.highlighted
                    ? "bg-white text-supet-orange"
                    : "bg-supet-orange text-white"
                    }`}
                >
                  {product.badge}
                </span>
              )}

              <h3 className="mt-2 text-xl font-extrabold">{product.title}</h3>
              <p className={`mt-1 text-sm ${product.highlighted ? "text-white/80" : "text-supet-text/50"}`}>
                {product.subtitle}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className={`text-xs mt-1 line-through ${product.highlighted ? "text-white/50" : "text-supet-text/35"}`}>
                R$ {product.originalPrice.toFixed(2).replace(".", ",")}
              </p>
              <p className={`text-xs mt-1 ${product.highlighted ? "text-white/70" : "text-supet-text/45"}`}>
                {product.pricePerUnit}
              </p>

              <div className="mt-auto pt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAdd(product)}
                  className={`w-full rounded-full py-3.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    product.highlighted
                      ? "bg-white text-supet-orange hover:bg-white/90 shadow-[0_8px_30px_-6px_rgba(255,255,255,0.4)]"
                      : "bg-supet-orange text-white hover:bg-supet-orange-dark shadow-[0_8px_30px_-6px_rgba(255,107,43,0.4)]"
                  } ${addedId === product.id ? "bg-green-500 text-white shadow-none hover:bg-green-600" : ""}`}
                >
                  <AnimatePresence mode="wait">
                    {addedId === product.id ? (
                      <motion.div
                        key="added"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> ADICIONADO
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        ADICIONAR AO CARRINHO
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
