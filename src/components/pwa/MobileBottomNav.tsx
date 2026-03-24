import { useLocation, Link } from "react-router-dom";
import { Home, ShoppingBag, Search, UserCircle, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "Início", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/blog", label: "Blog", icon: Search },
  { href: "/perfil", label: "Conta", icon: UserCircle, authRequired: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  // Hide on admin, checkout, login pages, and when profile sidebar is shown
  const hiddenPaths = ["/admin", "/checkout", "/login", "/cadastro", "/recuperar-senha", "/reset-password", "/success"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  // Only show on mobile in standalone mode or always for better UX
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(tab.href);
          const href = tab.authRequired && !user ? "/login" : tab.href;

          return (
            <Link
              key={tab.href}
              to={href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold mt-0.5">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* Cart button */}
        <button
          onClick={openCart}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-muted-foreground relative"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-semibold mt-0.5">Sacola</span>
          {totalItems > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
