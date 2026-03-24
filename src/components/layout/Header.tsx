import { useState, useEffect, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Music2,
  ShoppingBag,
  UserCircle,
} from "lucide-react";
import { socialLinks } from "@/services/mockData";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserNotificationCenter from "@/components/profile/UserNotificationCenter";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Ciência", href: "/ciencia" },
  { label: "Sobre", href: "/sobre" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

const iconByPlatform = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
} as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [restockCount, setRestockCount] = useState(0);
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  // Check for upcoming restock reminders
  useEffect(() => {
    if (!user) { setRestockCount(0); return; }
    const checkReminders = async () => {
      const today = new Date();
      const soon = new Date();
      soon.setDate(today.getDate() + 5);
      const { data } = await supabase
        .from("restock_reminders")
        .select("id")
        .eq("user_id", user.id)
        .lte("estimated_end_date", soon.toISOString().split("T")[0]);
      setRestockCount(data?.length || 0);
    };
    checkReminders();
  }, [user]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      if (location.pathname === "/") {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 md:border-b-0">
      <div className="relative mx-auto flex max-w-[1480px] items-center justify-between px-3 py-1.5 md:px-8 md:py-3">
        <Link to="/" onClick={handleLogoClick} className="relative z-10 flex shrink-0 items-center">
          <div className="relative h-[32px] w-[100px] md:h-[42px] md:w-[130px]">
            <img
              src="/supetLogoNew.png"
              alt="SUPET"
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        {/* Desktop nav — centered */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-xs font-bold uppercase tracking-[0.18em] text-supet-text/75 md:flex md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className="transition-colors hover:text-supet-orange"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4 text-muted-foreground">
          <div className="hidden lg:flex items-center gap-3 mr-2">
            {socialLinks.map((social) => {
              const Icon = iconByPlatform[social.platform];
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.ariaLabel}
                  className="transition-colors hover:text-supet-orange"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          {/* User icon — hidden on mobile (bottom nav has it) */}
          <Link
            to={user ? "/perfil" : "/login"}
            className="hidden md:flex relative p-2 text-foreground hover:text-primary transition-colors"
            aria-label={user ? "Meu Perfil" : "Entrar"}
          >
            <UserCircle className="w-5 h-5" />
            {restockCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-black flex items-center justify-center animate-pulse">
                {restockCount}
              </span>
            )}
          </Link>

          {/* Notification bell — next to cart */}
          {user && <UserNotificationCenter />}

          {/* Cart Toggle */}
          <button
            onClick={openCart}
            className="relative p-2 text-foreground hover:text-primary transition-colors active:scale-90"
            aria-label="Abrir Sacola"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile toggle — hidden since bottom nav handles navigation */}
        </div>
      </div>

      {/* Mobile menu removed — bottom nav handles navigation */}
    </header>
  );
}
