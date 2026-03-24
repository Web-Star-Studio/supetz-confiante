import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const { data: credits, error } = await supabase
      .from("ai_access_credits")
      .select("id, user_id, expires_at, order_id, profiles(email, full_name)")
      .lte("expires_at", threeDaysFromNow.toISOString())
      .gte("expires_at", now.toISOString())
      .order("expires_at", { ascending: true });

    if (error) throw error;

    if (!credits || credits.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expiring AI credits found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userLatest = new Map<string, typeof credits[0]>();
    for (const credit of credits) {
      const existing = userLatest.get(credit.user_id);
      if (!existing || new Date(credit.expires_at) > new Date(existing.expires_at)) {
        userLatest.set(credit.user_id, credit);
      }
    }

    let processed = 0;

    for (const [userId, credit] of userLatest) {
      const expiresAt = new Date(credit.expires_at);
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const expiryDate = expiresAt.toLocaleDateString("pt-BR");

      const { data: existingNotif } = await supabase
        .from("user_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "ai_expiry")
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingNotif && existingNotif.length > 0) {
        continue;
      }

      const urgencyText =
        daysLeft <= 0
          ? "expira hoje"
          : daysLeft === 1
            ? "expira amanhã"
            : `expira em ${daysLeft} dias`;

      await supabase.from("user_notifications").insert({
        user_id: userId,
        title: "⚠️ Seu acesso à Super IA " + urgencyText + "!",
        message: `Seu acesso ao assistente inteligente expira em ${expiryDate}. Faça uma nova compra para renovar automaticamente.`,
        type: "ai_expiry",
        link: "/perfil",
      });

      if (credit.profiles?.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "SuperPet <nao-responda@superpet.com.br>",
            to: [credit.profiles.email],
            subject: `Aviso: Seu acesso à Super IA ${urgencyText}`,
            html: `<h1>Olá, ${credit.profiles.full_name || "cliente"}!</h1>
                   <p>Seu acesso ao SuperPet AI <strong>${urgencyText}</strong> (em ${expiryDate}).</p>
                   <p>Para continuar aproveitando nosso assistente inteligente, realize uma nova compra em nossa loja.</p>
                   <a href="https://superpet.com.br/shop">Ir para a loja</a>`,
          }),
        });
      }

      await supabase.from("admin_notifications").insert({
        title: "🤖 Super IA expirando",
        message: `${credit.profiles?.full_name || "Cliente"} — acesso à Super IA ${urgencyText} (${expiryDate})`,
        type: "ai_expiry",
      });

      processed++;
    }

    return new Response(
      JSON.stringify({ message: `Processed ${processed} AI expiry notifications`, count: processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error checking AI expiry:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
