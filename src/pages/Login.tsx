import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("E-mail ou senha incorretos. Tente novamente.");
      setLoading(false);
    } else {
      // Small delay to let auth state update
      setTimeout(() => {
        navigate("/");
        setLoading(false);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-supet-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orange circles */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/10 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/8 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-16 h-16 rounded-full bg-primary/12 pointer-events-none animate-float-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 80, damping: 20 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex justify-center mb-8">
          <img src="/supetNewLogo.svg" alt="Supet" className="h-10" />
        </Link>

        <div className="bg-supet-bg-alt rounded-3xl p-8 md:p-10">
          <h1 className="text-2xl font-extrabold text-foreground mb-2 text-center font-display">
            Entrar na sua conta
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Gerencie seus pedidos e acompanhe seu pet
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-2xl p-4 mb-6 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-supet-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/recuperar-senha" className="text-sm text-primary font-semibold hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-primary font-semibold hover:underline">Criar conta</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
