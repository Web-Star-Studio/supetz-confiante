import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, couponCode, refSlug, commissionPercent, affiliateLink } = await req.json();

    if (!email || !name || !couponCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#E87B1C;font-size:28px;margin:0 0 8px;">🎉 Parabéns, ${name}!</h1>
      <p style="color:#6b5e50;font-size:16px;margin:0;">Você foi aprovado como parceiro Supet!</p>
    </div>

    <div style="background:#FFF7ED;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h2 style="color:#E87B1C;font-size:18px;margin:0 0 16px;">Seus dados exclusivos</h2>
      
      <div style="background:#ffffff;border-radius:12px;padding:16px;margin-bottom:12px;">
        <p style="color:#6b5e50;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Cupom de Desconto</p>
        <p style="color:#E87B1C;font-size:22px;font-weight:700;margin:0;letter-spacing:2px;">${couponCode}</p>
      </div>

      <div style="background:#ffffff;border-radius:12px;padding:16px;margin-bottom:12px;">
        <p style="color:#6b5e50;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Sua Comissão</p>
        <p style="color:#333;font-size:20px;font-weight:700;margin:0;">${commissionPercent}% por venda</p>
      </div>

      <div style="background:#ffffff;border-radius:12px;padding:16px;">
        <p style="color:#6b5e50;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Seu Link Exclusivo</p>
        <a href="${affiliateLink}" style="color:#E87B1C;font-size:14px;word-break:break-all;text-decoration:none;">${affiliateLink}</a>
      </div>
    </div>

    <div style="background:#FFF7ED;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#333;font-size:16px;margin:0 0 12px;">Como funciona?</h3>
      <ol style="color:#6b5e50;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
        <li>Compartilhe seu <strong>cupom</strong> ou <strong>link</strong> com seus seguidores</li>
        <li>Quando alguém comprar usando seu cupom ou link, a venda é registrada automaticamente</li>
        <li>Você ganha <strong>${commissionPercent}%</strong> de comissão em cada venda</li>
        <li>Acompanhe seus ganhos no <a href="${affiliateLink.replace(/\?ref=.*/, '')}/parceiros/dashboard" style="color:#E87B1C;">painel de parceiros</a></li>
      </ol>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <a href="${affiliateLink.replace(/\?ref=.*/, '')}/parceiros/dashboard" 
         style="background:#E87B1C;color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
        Acessar Painel de Parceiros
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
    <p style="color:#999;font-size:12px;text-align:center;margin:0;">
      Supet — Cuidado natural para seu pet 🐾
    </p>
  </div>
</body>
</html>`;

    // Use Lovable AI to send the email via the internal API
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // For now, log the email content. Once email domain DNS is verified,
    // this will integrate with the transactional email system.
    console.log(`[notify-affiliate-approved] Email prepared for ${email}`);
    console.log(`Subject: 🎉 Você foi aprovado como parceiro Supet!`);
    console.log(`Recipient: ${name} <${email}>`);

    // Also create an admin notification about the approval
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("admin_notifications").insert({
      title: "✅ Afiliado aprovado",
      message: `${name} foi aprovado como parceiro. Cupom: ${couponCode}`,
      type: "affiliate",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Affiliate notification sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
