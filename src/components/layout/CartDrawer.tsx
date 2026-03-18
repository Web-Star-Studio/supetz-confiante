import { ShoppingBag, X, Minus, Plus, Trash2, ShieldCheck, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

// Supet specific freeshipping threshold (adjustable)
const FREE_SHIPPING_THRESHOLD = 299.80; // i.e 2 pots

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, addItem, removeItem, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  // Calculate Progress
  const progress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);
  const hasFreeShipping = progress >= 100;

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-supet-bg/80 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={closeCart}
      />
      
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-supet-text/10">
          <div className="flex items-center gap-3 text-supet-text">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Sua Sacola</h2>
          </div>
          <button 
            onClick={closeCart}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-supet-orange/10 transform hover:rotate-90 transition-all text-supet-text/50 hover:text-supet-orange"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-supet-bg-alt px-6 py-4 border-b border-supet-text/5">
          <div className="flex justify-between items-end mb-2">
            <p className="text-sm font-bold text-supet-text">
              {hasFreeShipping ? (
                <span className="text-green-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Frete Grátis Liberado!
                </span>
              ) : (
                <>Faltam <span className="text-supet-orange">R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</span> para Frete Grátis</>
              )}
            </p>
          </div>
          <div className="h-2 w-full bg-supet-text/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${hasFreeShipping ? 'bg-green-500' : 'bg-supet-orange'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-supet-orange/20">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <ShoppingBag className="w-16 h-16 mb-4 text-supet-text/30" />
              <p className="text-lg font-bold text-supet-text">Sua sacola está vazia</p>
              <p className="text-sm">Que tal cuidar da saúde do seu pet?</p>
              <button onClick={closeCart} className="mt-8 text-supet-orange font-bold uppercase tracking-widest hover:underline">
                Voltar para a loja
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 group">
                  <div className="w-24 h-24 rounded-2xl bg-supet-bg flex-shrink-0 flex items-center justify-center overflow-hidden border border-supet-text/5">
                    <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-supet-text sm:text-lg leading-tight">{item.product.title}</h3>
                        <button onClick={() => removeItem(item.product.id)} className="text-supet-text/30 hover:text-red-500 transition-colors p-1" title="Remover item">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-supet-text/50 mt-1">{item.product.subtitle}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 bg-white border border-supet-text/10 rounded-full px-3 py-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="text-supet-text/50 hover:text-supet-orange transition-colors p-1">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-supet-text w-4 text-center select-none">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="text-supet-text/50 hover:text-supet-orange transition-colors p-1">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-black text-supet-text">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-supet-text/10 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] z-10">
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-supet-text/60 font-bold uppercase tracking-wider text-sm">Total a pagar</span>
              <span className="text-3xl font-black text-supet-text">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                closeCart();
                // Wait for the drawer close animation (approx 300-500ms) before navigating
                setTimeout(() => {
                  navigate('/checkout');
                }, 400);
              }}
              className="w-full flex items-center justify-center gap-2 bg-supet-orange text-white rounded-full py-5 font-black uppercase tracking-widest hover:bg-supet-orange-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_30px_-6px_rgba(255,107,43,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(255,107,43,0.6)] group"
            >
              Finalizar Compra
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-center mt-4 text-xs font-bold text-supet-text/40 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Compra 100% Segura
            </p>
          </div>
        )}
      </div>
    </>
  );
}
