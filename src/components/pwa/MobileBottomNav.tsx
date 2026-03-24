import { useLocation, Link } from "react-router-dom";
import { Home, ShoppingBag, Search, UserCircle, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "Início", icon: Home },
  { href: "/shop", label: "Loja", icon: ShoppingBag },
  { href: "/blog", label: "Blog", icon: Search },
  { href: "/perfil", label: "Conta", icon: UserCircle, authRequired: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  const hiddenPaths = ["/admin", "/checkout", "/login", "/cadastro", "/recuperar-senha", "/reset-password", "/success"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-border/50" />
      
      <div className="relative flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const isActive = tab.href === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.href);
          const href = tab.authRequired && !user ? "/login" : tab.href;

          return (
            <Link
              key={tab.href}
              to={href}
              className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 relative active:scale-90 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <tab.icon className={`h-[22px] w-[22px] transition-all duration-200 ${isActive ? "stroke-[2.5px]" : ""}`} />
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-glow"
                    className="absolute -inset-2 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* Cart — central floating button */}
        <button
          onClick={openCart}
          className="flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl text-muted-foreground relative active:scale-90 transition-transform"
        >
          <div className="relative">
            <ShoppingBag className="h-[22px] w-[22px]" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1"
              >
                {totalItems}
              </motion.span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Sacola</span>
        </button>
      </div>
    </nav>
  );
}
