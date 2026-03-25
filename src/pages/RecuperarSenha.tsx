import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import supetLogo from "@/assets/supet-logo-header.png";

export default function RecuperarSenha() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError("Erro ao enviar o e-mail. Verifique o endereço.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring" as const, stiffness: 80, damping: 20 }} className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <img src={supetLogo} alt="Supet" className="h-16 md:h-20 w-auto" />
        </Link>

        <div className="bg-card rounded-3xl p-8 md:p-10 border border-border">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-3 font-display">E-mail enviado!</h2>
              <p className="text-muted-foreground text-sm mb-6">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
              <Link to="/login" className="text-primary font-semibold hover:underline text-sm">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-foreground mb-2 text-center font-display">Recuperar senha</h1>
              <p className="text-muted-foreground text-center mb-8 text-sm">Informe seu e-mail para receber um link de redefinição</p>

              {error && <div className="bg-destructive/10 text-destructive text-sm rounded-2xl p-4 mb-6 text-center font-medium">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm" />
                  </div>
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link"}
                </motion.button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8 hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
