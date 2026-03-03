import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-supetz-bg-alt py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div>
            <Link to="/" className="text-2xl font-black text-supetz-text tracking-tight">
              Supetz<span className="text-supetz-orange">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-supetz-text/60 leading-relaxed">
              Gomas 100% naturais para a saúde e felicidade do seu pet. Resultados em 7 dias.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-supetz-text/40 mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Início</Link></li>
                <li><Link to="/sobre" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Sobre Nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-supetz-text/40 mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#faq" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">FAQ</a></li>
                <li><a href="mailto:contato@supetz.com.br" className="text-supetz-text/60 hover:text-supetz-orange transition-colors">Contato</a></li>
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
