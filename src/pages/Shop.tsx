import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Star, ShieldCheck, Leaf, PackageCheck, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead, { buildProductSchema, buildBreadcrumbSchema } from "@/components/SEOHead";
import PricingSection from "@/components/landing/PricingSection";
import ExtrasSection from "@/components/landing/ExtrasSection";
import FAQStandaloneSection from "@/components/landing/FAQStandaloneSection";
import DosageCalculator from "@/components/landing/DosageCalculator";
import { motionTokens } from "@/lib/motion";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types";

const productDetails = [
  {
    id: "benefits",
    title: "Benefícios Clínicos",
    icon: ShieldCheck,
    content: "Desenvolvido por especialistas para entregar suporte imunológico avançado, interrupção rápida de coceiras e alergias, brilho espelhado na pelagem e fortalecimento estrutural das articulações."
  },
  {
    id: "ingredients",
    title: "Ingredientes Premium",
    icon: Leaf,
    content: "Colágeno Peptídeo de alta absorção (500mg), Ômega 3 puro extraído a frio (250mg), Biotina Complex e um blend exclusivo de antioxidantes naturais. Livre de corantes, transgênicos e conservantes artificiais."
  },
  {
    id: "usage",
    title: "Ritual de Uso",
    icon: Star,
    content: "Ofereça 1 goma diária para cães até 10kg, 2 gomas para 11kg a 25kg, e 3 gomas para cães acima de 25kg. A textura macia e o sabor idêntico a carne garantem 99% de aceitação."
  },
  {
    id: "shipping",
    title: "Envio e Garantia",
    icon: PackageCheck,
    content: "Frete expresso gratuito para compras acima de 2 potes. Confiamos tanto na nossa fórmula que oferecemos o Desafio 30 Dias: se não ver resultados, devolvemos 100% do seu dinheiro."
  }
];

// Fallback product while DB loads
const fallbackProduct: Product = {
  id: "combo-1",
  title: "O Queridinho",
  subtitle: "1 pote • Tratamento de 30 dias",
  price: 149.90,
  originalPrice: 199.90,
  pricePerUnit: "R$ 149,90/pote",
  quantity: 1,
  category: "combo",
  image: "/images/PoteNovo2.png"
};

export default function Shop() {
  const { addItem } = useCart();
  const { products: comboProducts, loading } = useProducts({ category: "combo" });
  const [activeAccordion, setActiveAccordion] = useState<string | null>("benefits");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Use first combo product from DB, or fallback
  const mainProduct = comboProducts.length > 0
    ? { ...comboProducts[0], image: comboProducts[0].image || "/images/PoteNovo2.png" }
    : fallbackProduct;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(mainProduct);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="Loja — Gomas Naturais Supet"
        description="Compre as gomas naturais Supet para seu cão. Ômega 3, biotina e colágeno para acabar com coceira, alergia e queda de pelo. Frete grátis e garantia de 30 dias."
        path="/shop"
        jsonLd={[
          buildProductSchema({
            name: "Supet Gomas Naturais — O Queridinho",
            description: "1 pote com 30 gomas naturais para tratamento de coceira, alergia e queda de pelo em cães.",
            price: mainProduct.price,
            rating: 4.9,
            reviewCount: 2847,
          }),
          buildBreadcrumbSchema([
            { name: "Home", url: "https://supetz-playful-trust.lovable.app/" },
            { name: "Loja", url: "https://supetz-playful-trust.lovable.app/shop" },
          ]),
        ]}
      />
      <ShopHero
        mainProduct={mainProduct}
        quantity={quantity}
        setQuantity={setQuantity}
        added={added}
        handleAddToCart={handleAddToCart}
        activeAccordion={activeAccordion}
        setActiveAccordion={setActiveAccordion}
        loading={loading}
      />

      <DosageCalculator />
      <PricingSection />
      <ExtrasSection />
      <FAQStandaloneSection />
    </Layout>
  );
}

// Extracted hero component to keep Shop.tsx clean
function ShopHero({
  mainProduct, quantity, setQuantity, added, handleAddToCart,
  activeAccordion, setActiveAccordion, loading,
}: {
  mainProduct: Product;
  quantity: number;
  setQuantity: (q: number) => void;
  added: boolean;
  handleAddToCart: () => void;
  activeAccordion: string | null;
  setActiveAccordion: (id: string | null) => void;
  loading: boolean;
}) {
  return (
    <section className="bg-supet-bg pt-6 md:pt-32 pb-24 border-b border-border/30 relative">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-12">
        <div className="mb-4 md:mb-8">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Home / <span className="text-primary">Loja</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-32">
          {/* Left Column: Fixed Gallery */}
          <div className="relative">
            <div className="lg:sticky lg:top-32 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.durationSlow, ease: motionTokens.easeOut }}
                className="relative w-full aspect-[4/5] md:aspect-square flex items-center justify-center p-4 group"
              >
                <motion.img
                  src={mainProduct.image}
                  alt="Pote Supet"
                  className="relative z-10 w-[85%] md:w-[90%] max-w-[520px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </motion.div>
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col justify-center py-4 lg:py-16">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: motionTokens.easeOut }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-supet-orange">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span className="text-sm font-bold text-supet-text/60">4.9/5 (1.2k+ avaliações)</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight mb-2 uppercase">
                Goma Supet
              </h1>
              <p className="text-sm md:text-xl text-muted-foreground font-medium mb-6 md:mb-8">
                O suplemento diário definitivo para a saúde da pele, imunidade e articulações do seu cão.
              </p>

              <div className="flex items-baseline gap-3 mb-6 md:mb-8">
                <span className="text-3xl md:text-4xl font-black text-foreground">
                  R$ {mainProduct.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-base md:text-xl font-bold text-muted-foreground/50 line-through">
                  R$ {mainProduct.originalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12">
                <div className="flex items-center justify-between border-2 border-border rounded-2xl px-5 py-3 sm:w-1/3 bg-background">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-supet-text/50 hover:text-supet-orange transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-black text-supet-text">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-supet-text/50 hover:text-supet-orange transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-full py-4 px-8 text-lg font-black uppercase tracking-widest transition-all duration-300 hover:shadow-xl flex justify-center items-center ${
                    added
                      ? "bg-green-500 text-white hover:bg-green-600 shadow-none border border-green-500/20"
                      : "bg-supet-text hover:bg-supet-orange text-white hover:shadow-supet-orange/20"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.div key="added" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                        <Check className="w-5 h-5 flex-shrink-0" /> ADICIONADO
                      </motion.div>
                    ) : (
                      <motion.div key="add" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        Adicionar à Sacola
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Accordion */}
              <div className="border-t border-supet-text/10">
                {productDetails.map((detail) => {
                  const Icon = detail.icon;
                  const isActive = activeAccordion === detail.id;
                  return (
                    <div key={detail.id} className="border-b border-supet-text/10">
                      <button onClick={() => setActiveAccordion(isActive ? null : detail.id)} className="w-full flex items-center justify-between py-6 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-supet-orange/5 flex items-center justify-center group-hover:bg-supet-orange/10 transition-colors">
                            <Icon className="w-5 h-5 text-supet-orange" />
                          </div>
                          <span className="text-lg font-bold text-supet-text group-hover:text-supet-orange transition-colors uppercase tracking-wide">
                            {detail.title}
                          </span>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                          {isActive ? <Minus className="w-5 h-5 text-supet-text/50" /> : <Plus className="w-5 h-5 text-supet-text/50" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pb-6 pl-14 pr-8 text-supet-text/60 font-medium leading-relaxed">
                              {detail.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
