import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { products } from "@/services/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export default function StickyCartBar() {
  const [isVisible, setIsVisible] = useState(false);
  const { addItem, totalItems, openCart } = useCart();

  // Find the primary product to add (The single jar combo)
  const defaultProduct = products.find(p => p.id === "combo-1") || products[0];

  useEffect(() => {
    const handleScroll = () => {
      // Show the sticky bar after scrolling down past the main hero/initial buy buttons
      const threshold = window.innerHeight * 0.8;
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="fixed bottom-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-supet-text/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 mx-auto max-w-7xl">
            
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase text-supet-text/50 tracking-widest">{defaultProduct.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-supet-text">R$ {defaultProduct.price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={openCart}
                className="relative p-2 text-supet-text bg-supet-bg rounded-full border border-supet-text/5"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-supet-orange text-white text-[9px] font-black flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => addItem(defaultProduct)}
                className="bg-supet-orange hover:bg-supet-orange-dark text-white rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-supet-orange/20"
              >
                Comprar
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* Desktop Version */}
      {isVisible && (
        <motion.div
           initial={{ y: "100%", opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: "100%", opacity: 0 }}
           transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
           className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-supet-text/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] px-6 py-3"
        >
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-supet-text/10">
                    <img src={defaultProduct.image} alt={defaultProduct.title} className="w-10 h-10 object-contain drop-shadow-md" />
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-supet-text">{defaultProduct.title}</span>
                        <span className="text-xs text-supet-text/50 font-bold">Tratamento 30 dias</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-supet-text">R$ {defaultProduct.price.toFixed(2).replace('.', ',')}</span>
                    <button
                        onClick={() => addItem(defaultProduct)}
                        className="bg-supet-orange hover:bg-supet-orange-dark text-white rounded-full px-8 py-3 text-sm font-black uppercase tracking-widest transition-colors shadow-lg shadow-supet-orange/20 hover:scale-105"
                    >
                        Comprar Agora
                    </button>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
