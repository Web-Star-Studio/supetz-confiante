import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import Layout from "@/components/layout/Layout";
import { CheckCircle2, Package, MapPin, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";
import JSConfetti from 'js-confetti';

export default function Success() {
  const { clearCart } = useCart();
  
  useEffect(() => {
    // Clear the cart on successful render of the success page
    clearCart();

    // Fire confetti for a rewarding feeling!
    const jsConfetti = new JSConfetti();
    setTimeout(() => {
      jsConfetti.addConfetti({
        emojis: ['🐶', '✨', '🐾', '🧡'],
        confettiNumber: 50,
      });
    }, 500);

  }, [clearCart]);

  return (
    <Layout>
      <div className="min-h-screen bg-supet-bg pt-32 pb-24 relative overflow-hidden flex items-center justify-center">
        
        {/* Background blobs for a premium look */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-supet-orange/10 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-supet-text/5 rounded-full blur-[120px] pointer-events-none" 
        />
        
        <div className="relative z-10 mx-auto max-w-[800px] px-6 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-supet-text/5 relative overflow-hidden"
          >
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div className="absolute -inset-4 border border-green-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-4xl md:text-5xl font-black text-supet-text tracking-tight uppercase mb-4"
            >
              Pedido Confirmado!
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-lg md:text-xl text-supet-text/60 font-medium mb-10 max-w-lg mx-auto leading-relaxed"
            >
              Obrigado pela sua compra. O seu pet vai <Heart className="w-5 h-5 inline text-supet-orange mx-1 fill-current" /> essa escolha saudável!
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-supet-bg-alt rounded-2xl p-6 text-left border border-supet-text/5 flex gap-4 hover:border-supet-orange/20 transition-colors"
              >
                <Package className="w-8 h-8 text-supet-text/40 shrink-0" />
                <div>
                  <h3 className="font-bold text-supet-text uppercase tracking-wider text-sm mb-1">Status do Pedido</h3>
                  <p className="text-sm font-medium text-supet-text/60">Sendo preparado com carinho</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-supet-bg-alt rounded-2xl p-6 text-left border border-supet-text/5 flex gap-4 hover:border-supet-orange/20 transition-colors"
              >
                <MapPin className="w-8 h-8 text-supet-text/40 shrink-0" />
                <div>
                  <h3 className="font-bold text-supet-text uppercase tracking-wider text-sm mb-1">Previsão</h3>
                  <p className="text-sm font-medium text-supet-text/60">Acompanhamento via E-mail</p>
                </div>
              </motion.div>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-sm text-supet-text/50 font-medium mb-10"
            >
              Enviamos um e-mail com os detalhes do seu pedido e as informações de rastreio em breve.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <Link 
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-supet-orange text-white rounded-full py-5 px-10 text-lg font-black uppercase tracking-widest hover:bg-supet-orange-dark transition-all duration-300 shadow-[0_8px_30px_-6px_rgba(255,107,43,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(255,107,43,0.6)] hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                Continuar Comprando
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
