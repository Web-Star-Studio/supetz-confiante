import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import supetLogo from "@/assets/supet-logo-header.png";

export default function Cadastro() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError("Erro ao criar conta. Tente novamente.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-supet-bg flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/10 pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10 text-center">
           <Link to="/" className="flex justify-center mb-6">
             <img src={supetLogo} alt="Supet" className="h-16 md:h-20 w-auto" />
           </Link>
          <div className="bg-supet-bg-alt rounded-3xl p-10">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3 font-display">Conta criada!</h2>
            <p className="text-muted-foreground text-sm">Sua conta foi criada com sucesso. Você já pode fazer login.</p>
            <Link to="/login" className="inline-block mt-8 text-primary font-semibold hover:underline text-sm">Ir para login</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-supet-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orange circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/10 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-primary/8 pointer-events-none" />
      <div className="absolute bottom-1/4 left-8 w-12 h-12 rounded-full bg-primary/12 pointer-events-none animate-float-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 80, damping: 20 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex justify-center mb-6">
          <img src={supetLogo} alt="Supet" className="h-16 md:h-20 w-auto" />
        </Link>

        <div className="bg-supet-bg-alt rounded-3xl p-8 md:p-10">
          <h1 className="text-2xl font-extrabold text-foreground mb-2 text-center font-display">Criar sua conta</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">Junte-se à comunidade Supet</p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-2xl p-4 mb-6 text-center font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Seu nome"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Criar conta <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-supet-bg-alt px-3 text-muted-foreground">ou continue com</span></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            }}
            className="w-full py-3.5 rounded-full border border-muted bg-supet-bg text-foreground font-semibold text-sm flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Criar conta com Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Já tem conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
