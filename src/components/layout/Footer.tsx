import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Music2, ArrowRight } from "lucide-react";
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
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#FE6D00] to-[#E56200] pt-20 pb-10 text-white">
      {/* Decorative large text */}
      <div className="pointer-events-none absolute -right-10 bottom-0 select-none opacity-5">
        <span className="text-[15rem] font-bold leading-none tracking-tighter">
          SUPET
        </span>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">

          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block bg-white rounded-2xl p-3 shadow-lg hover:scale-105 transition-transform duration-300">
              <img
                src={supetLogo}
                alt="Supet - Suplemento Animal"
                className="h-16 w-auto"
              />
            </Link>
            <p className="mt-6 text-sm text-white/90 leading-relaxed font-medium">
              Mais que suplemento: um gesto diário de cuidado para a pele, pelagem e imunidade do seu pet.
            </p>

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = iconByPlatform[social.platform];
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.ariaLabel}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-white hover:text-[#FE6D00]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-1 lg:pl-12">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Navegação</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/" className="text-white/80 hover:text-white hover:translate-x-1 inline-block transition-all">Início</Link></li>
              <li><Link to="/shop" className="text-white/80 hover:text-white hover:translate-x-1 inline-block transition-all">Nossos Produtos</Link></li>
              <li><Link to="/blog" className="text-white/80 hover:text-white hover:translate-x-1 inline-block transition-all">Blog Supetz</Link></li>
              <li><a href="/#faq" className="text-white/80 hover:text-white hover:translate-x-1 inline-block transition-all">Dúvidas Frequentes (FAQ)</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Atendimento</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <span className="block text-white/60 text-xs uppercase mb-1">E-mail</span>
                <a href="mailto:contato@supetz.com.br" className="text-white/90 hover:text-white transition-colors">contato@supetz.com.br</a>
              </li>
              <li>
                <span className="block text-white/60 text-xs uppercase mb-1">WhatsApp / Telefone</span>
                <a href="tel:+551099582200" className="text-white/90 hover:text-white transition-colors">(10) 9958-2200</a>
              </li>
              <li>
                <span className="block text-white/60 text-xs uppercase mb-1">Horário</span>
                <span className="text-white/90">Seg a Sex das 09h às 18h</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Novidades</h4>
            <p className="text-sm text-white/80 font-medium mb-4">
              Receba dicas de saúde pet e ofertas exclusivas direto no seu e-mail.
            </p>
            <form className="mt-2 flex max-w-md gap-x-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="email-address" className="sr-only">Endereço de e-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="Seu melhor e-mail"
                className="min-w-0 flex-auto rounded-xl border-0 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
              />
              <button
                type="submit"
                className="flex flex-none items-center justify-center rounded-xl bg-white px-4 py-3 text-[#FE6D00] shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                aria-label="Inscrever-se na newsletter"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/70 font-medium">
          <p>© {new Date().getFullYear()} Supetz. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
