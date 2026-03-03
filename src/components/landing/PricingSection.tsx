import { motion } from "framer-motion";
import { products } from "@/services/mockData";
import { useCart } from "@/context/CartContext";

export default function PricingSection() {
  const { addItem } = useCart();

  return (
    <section id="precos" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-supetz-text">
            Escolha o melhor <span className="text-supetz-orange">combo</span> para seu pet
          </h2>
          <p className="mt-4 text-supetz-text/50 max-w-lg mx-auto">
            Quanto mais potes, maior o desconto. Frete grátis para todo o Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ scale: 1.02 }}
              className={`relative flex flex-col rounded-3xl p-8 ${
                product.highlighted
                  ? "bg-supetz-orange text-white ring-4 ring-supetz-orange/30"
                  : "bg-supetz-bg-alt text-supetz-text"
              }`}
            >
              {product.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold ${
                    product.highlighted
                      ? "bg-white text-supetz-orange"
                      : "bg-supetz-orange text-white"
                  }`}
                >
                  {product.badge}
                </span>
              )}

              <h3 className="mt-2 text-xl font-extrabold">{product.title}</h3>
              <p className={`mt-1 text-sm ${product.highlighted ? "text-white/80" : "text-supetz-text/50"}`}>
                {product.subtitle}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className={`text-xs mt-1 line-through ${product.highlighted ? "text-white/50" : "text-supetz-text/35"}`}>
                R$ {product.originalPrice.toFixed(2).replace(".", ",")}
              </p>
              <p className={`text-xs mt-1 ${product.highlighted ? "text-white/70" : "text-supetz-text/45"}`}>
                {product.pricePerUnit}
              </p>

              <div className="mt-auto pt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addItem(product)}
                  className={`w-full rounded-full py-3.5 text-sm font-bold transition-colors ${
                    product.highlighted
                      ? "bg-white text-supetz-orange hover:bg-white/90"
                      : "bg-supetz-orange text-white hover:bg-supetz-orange-dark"
                  }`}
                >
                  ADICIONAR AO CARRINHO
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
