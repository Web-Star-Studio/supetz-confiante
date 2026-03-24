import { useRef } from "react";
import { ShoppingBag, X, Minus, Plus, Trash2, ShieldCheck, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";

const FREE_SHIPPING_THRESHOLD = 299.80;

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, addItem, removeItem, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  const progress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);
  const hasFreeShipping = progress >= 100;

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Swipe right to close (threshold 100px or velocity > 500)
    if (info.offset.x > 100 || info.velocity.x > 500) {
      closeCart();
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]"
        onClick={closeCart}
      />

      <motion.div
        ref={constraintsRef}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={handleDragEnd}
        className="fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-background shadow-2xl z-[110] flex flex-col touch-pan-y"
      >
        {/* Drag handle indicator — mobile */}
        <div className="md:hidden flex justify-center pt-2 pb-0">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 md:p-6 border-b border-border/50">
          <div className="flex items-center gap-2.5 text-foreground">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">Sua Sacola</h2>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-muted/50 px-5 py-3 md:px-6 md:py-4 border-b border-border/30">
          <p className="text-xs md:text-sm font-bold text-foreground mb-1.5">
            {hasFreeShipping ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Frete Grátis Liberado!
              </span>
            ) : (
              <>Faltam <span className="text-primary">R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</span> para Frete Grátis</>
            )}
          </p>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${hasFreeShipping ? 'bg-emerald-500' : 'bg-primary'}`}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide overscroll-contain">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-bold text-foreground">Sacola vazia</p>
              <p className="text-sm text-muted-foreground mt-1">Que tal cuidar do seu pet?</p>
              <button onClick={closeCart} className="mt-6 text-primary font-bold text-sm active:scale-95 transition-transform">
                Voltar para a loja →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="flex gap-3 bg-muted/30 rounded-2xl p-3 group"
                >
                  <div className="w-20 h-20 rounded-xl bg-background flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                    <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-sm leading-tight truncate">{item.product.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.product.subtitle}</p>
                      </div>
                      <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 active:scale-90 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-background border border-border/50 rounded-full px-2.5 py-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="text-muted-foreground hover:text-primary transition-colors active:scale-90 p-0.5">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-foreground w-4 text-center select-none">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="text-muted-foreground hover:text-primary transition-colors active:scale-90 p-0.5">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-foreground text-sm">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 bg-background border-t border-border/50 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] safe-area-bottom">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Total</span>
              <span className="text-2xl md:text-3xl font-black text-foreground">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                closeCart();
                setTimeout(() => navigate('/checkout'), 400);
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 group"
            >
              Finalizar Compra
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Compra 100% Segura
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
