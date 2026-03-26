import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Handshake, TrendingUp, Gift, Link2, Users, Star, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const benefits = [
  { icon: TrendingUp, title: "Comissão por Venda", desc: "Ganhe até 15% de comissão em cada venda realizada com seu cupom ou link." },
  { icon: Gift, title: "Cupom Exclusivo", desc: "Receba um cupom personalizado para oferecer desconto aos seus seguidores." },
  { icon: Link2, title: "Link Rastreável", desc: "Compartilhe seu link único e acompanhe cliques e conversões em tempo real." },
  { icon: Users, title: "Painel Completo", desc: "Acompanhe vendas, ganhos e saques pelo seu dashboard exclusivo." },
];

export default function Parceiros() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    instagram: "",
    channel_type: "influencer",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para se candidatar.");
      return;
    }
    setLoading(true);

    // Check if already applied
    const { data: existing } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast.info("Você já possui uma candidatura enviada!");
      setLoading(false);
      setSubmitted(true);
      return;
    }

    const refSlug = form.name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(2, 6);

    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      name: form.name,
      email: form.email,
      instagram: form.instagram || null,
      channel_type: form.channel_type,
      ref_slug: refSlug,
    });

    if (error) {
      toast.error("Erro ao enviar candidatura. Tente novamente.");
    } else {
      setSubmitted(true);
      toast.success("Candidatura enviada com sucesso!");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 md:pt-32 pb-24">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Handshake className="w-4 h-4" /> Programa de Parceiros
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Indique a Supet e <span className="text-primary">ganhe comissões</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seja um parceiro, influenciador ou creator. Compartilhe seu link exclusivo, ofereça desconto aos seus seguidores e ganhe comissão em cada venda.
            </p>
          </motion.div>
        </div>

        {/* Benefits */}
        <div className="max-w-5xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto px-6 mb-20">
          <h2 className="text-2xl font-black text-foreground text-center mb-10">Como funciona?</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Cadastre-se", desc: "Preencha o formulário abaixo com seus dados." },
              { step: "2", title: "Aprovação", desc: "Nossa equipe analisa e aprova sua candidatura." },
              { step: "3", title: "Compartilhe", desc: "Receba seu cupom e link exclusivo para divulgar." },
              { step: "4", title: "Ganhe", desc: "Acompanhe vendas e solicite saques pelo painel." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-sm shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Candidatura Enviada!</h3>
                <p className="text-muted-foreground mb-6">Analisaremos sua candidatura e entraremos em contato em breve.</p>
                {user && (
                  <Link to="/parceiros/painel" className="text-primary font-bold hover:underline">
                    Ir para o Painel →
                  </Link>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Quero ser Parceiro
                </h2>
                {!user && (
                  <div className="bg-muted rounded-xl p-4 mb-6 text-sm text-muted-foreground">
                    Você precisa estar <Link to="/login" className="text-primary font-bold hover:underline">logado</Link> para se candidatar.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Nome completo</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">E-mail</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Instagram (opcional)</label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@seuinstagram"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Tipo de canal</label>
                    <select
                      value={form.channel_type}
                      onChange={(e) => setForm({ ...form, channel_type: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="influencer">Influenciador</option>
                      <option value="partner">Parceiro / Loja</option>
                      <option value="creator">Creator / Blog</option>
                      <option value="vet">Veterinário</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={!user || loading}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                    {loading ? "Enviando..." : "Enviar Candidatura"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
