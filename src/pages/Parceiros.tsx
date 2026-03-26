import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Handshake, TrendingUp, Gift, Link2, Users, Star, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motionTokens } from "@/lib/motion";
import ParceirosHero from "@/components/parceiros/ParceirosHero";
import ParceirosStats from "@/components/parceiros/ParceirosStats";
import ParceirosBenefits from "@/components/parceiros/ParceirosBenefits";
import ParceirosTimeline from "@/components/parceiros/ParceirosTimeline";
import ParceirosForm from "@/components/parceiros/ParceirosForm";
import ParceirosCTA from "@/components/parceiros/ParceirosCTA";

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
      <div className="min-h-screen bg-background">
        <ParceirosHero />
        <ParceirosStats />
        <ParceirosBenefits />
        <ParceirosTimeline />
        <ParceirosForm
          user={user}
          form={form}
          setForm={setForm}
          loading={loading}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
        <ParceirosCTA />
      </div>
    </Layout>
  );
}
