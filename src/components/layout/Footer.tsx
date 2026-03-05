import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Music2 } from "lucide-react";
import { socialLinks } from "@/services/mockData";
import supetLogo from "/images/SUPET.png";

const iconByPlatform = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
} as const;

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-supetz-bg-alt py-16">
      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-supetz-orange/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-40 w-40 rounded-full bg-supetz-orange/15 blur-2xl" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-sm">
            <Link to="/" className="inline-block">
              <img
                src={supetLogo}
                alt="Supet - Suplemento Animal"
                className="h-20 w-auto md:h-32"
              />
            </Link>
            <p className="mt-3 text-sm text-supetz-text/60 leading-relaxed">
              Mais que suplemento: um gesto diário de cuidado para pele, pelagem e imunidade do seu pet.
            </p>

            <div className="mt-5 flex items-center gap-4 text-supetz-text/70">
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

          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-supetz-text/40 mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Início</Link></li>
                <li><Link to="/shop" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Shop</Link></li>
                <li><Link to="/blog" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-supetz-text/40 mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#faq" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">FAQ</a></li>
                <li><a href="mailto:contato@supetz.com.br" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Contato</a></li>
                <li><a href="tel:+551099582200" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">(10) 9958-2200</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-supetz-text/10 pt-6 text-center text-xs text-supetz-text/40">
          © {new Date().getFullYear()} Supetz. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
