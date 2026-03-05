import { useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  X,
  Facebook,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import { socialLinks } from "@/services/mockData";
import supetHeaderLogo from "/images/supet-header-logo.png";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
  { label: "Por que Supet?", href: "/#beneficios" },
  { label: "FAQ", href: "/#faq" },
];

const iconByPlatform = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
} as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

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

  return (
    <header className="sticky top-0 z-50 bg-supetz-bg/80 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-[1480px] items-center justify-between px-4 py-2 md:px-8 md:py-3">
        <Link to="/" className="relative z-10 flex shrink-0 items-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={supetHeaderLogo}
              alt="Supet - Suplemento Animal"
              className="block h-[46px] w-auto md:h-[56px]"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -1.25, 0],
                      rotate: [0, -0.45, 0.25, 0],
                      scale: [1, 1.01, 1],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: {
                        duration: 3.6,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1.2,
                      },
                      rotate: {
                        duration: 3.6,
                        ease: "easeInOut",
                        times: [0, 0.35, 0.7, 1],
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1.2,
                      },
                      scale: {
                        duration: 3.6,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1.2,
                      },
                    }
              }
            />
          </motion.div>
        </Link>

        {/* Desktop nav — centered */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-xs font-bold uppercase tracking-[0.18em] text-supetz-text/75 md:flex md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className="transition-colors hover:text-supetz-orange"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-supetz-text/75">
          <div className="hidden lg:flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = iconByPlatform[social.platform];
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.ariaLabel}
                  className="transition-colors hover:text-supetz-orange"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/30 md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className="text-base font-semibold text-supetz-text/70 hover:text-supetz-orange"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex items-center gap-4 border-t border-supetz-text/10 pt-4 text-supetz-text/70">
                {socialLinks.map((social) => {
                  const Icon = iconByPlatform[social.platform];
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.ariaLabel}
                      className="transition-colors hover:text-supetz-orange"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
