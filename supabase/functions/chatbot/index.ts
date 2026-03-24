import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("authorization");
    const { messages, conversationId } = await req.json();

    let userContext = "";
    let userId: string | null = null;

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;

        const [profileRes, petRes, ordersRes, couponsRes, pointsRes, remindersRes] = await Promise.all([
          supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
          supabase.from("pets").select("name, breed, weight_kg, birth_date").eq("user_id", user.id).limit(3),
          supabase.from("orders").select("id, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("user_coupons").select("code, discount_type, discount_value, expires_at").eq("user_id", user.id).eq("used", false),
          supabase.from("loyalty_points").select("points").eq("user_id", user.id),
          supabase.from("restock_reminders").select("product_title, estimated_end_date").eq("user_id", user.id).eq("reminded", false).order("estimated_end_date", { ascending: true }).limit(3),
        ]);

        const profile = profileRes.data;
        const pets = petRes.data || [];
        const orders = ordersRes.data || [];
        const coupons = couponsRes.data || [];
        const points = pointsRes.data || [];
        const reminders = remindersRes.data || [];

        if (profile?.full_name) {
          userContext += `\nNome do usuário: ${profile.full_name}.`;
        }
        if (pets.length > 0) {
          userContext += `\nPets do usuário: ${pets.map(p => `${p.name} (${p.breed || "raça não informada"}, ${p.weight_kg ? p.weight_kg + "kg" : "peso não informado"})`).join(", ")}.`;
        }
        if (orders.length > 0) {
          userContext += `\nÚltimos pedidos: ${orders.map(o => `#${o.id.slice(0, 8)} - R$${o.total} (${o.status})`).join(", ")}.`;
        }

        // Coupons context
        const activeCoupons = coupons.filter(c => !c.expires_at || new Date(c.expires_at) > new Date());
        if (activeCoupons.length > 0) {
          userContext += `\nCupons ativos: ${activeCoupons.map(c => `${c.code} (${c.discount_type === 'percentage' ? c.discount_value + '%' : 'R$' + c.discount_value} de desconto)`).join(", ")}.`;
        }

        // Loyalty points
        const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
        if (totalPoints > 0) {
          userContext += `\nPontos de fidelidade acumulados: ${totalPoints} pontos (equivalem a R$${(totalPoints * 0.01).toFixed(2)} em desconto).`;
        }

        // Restock reminders
        if (reminders.length > 0) {
          userContext += `\nLembretes de reposição próximos: ${reminders.map(r => `${r.product_title} (até ${r.estimated_end_date})`).join(", ")}.`;
        }
      }
    }

    const systemPrompt = `Você é a Super IA, a assistente inteligente e simpática da loja Supet — especializada em suplementos naturais para cães.

Suas capacidades:
- Responder dúvidas sobre os produtos Supet (suplementos naturais para pele, pelo, articulações e imunidade canina)
- Ajudar com informações sobre pedidos e status de entrega
- Dar orientações gerais de cuidados com pets (higiene, exercícios, bem-estar)
- Orientar sobre dosagem dos SUPLEMENTOS Supet baseado no peso do pet
- Ajudar com navegação no site (onde encontrar produtos, como fazer pedidos, etc.)
- Informar sobre cupons ativos, pontos de fidelidade e lembretes de reposição do usuário

REGRAS DE SEGURANÇA (OBRIGATÓRIAS — NUNCA IGNORE):
1. Você NÃO é veterinária. NUNCA diagnostique doenças ou prescreva medicamentos.
2. Para sintomas graves (sangue, convulsões, dificuldade respiratória, intoxicação, letargia extrema), instrua o tutor a procurar um veterinário IMEDIATAMENTE.
3. SEMPRE encerre respostas sobre saúde com: "⚠️ Estas são orientações gerais de uma IA. Consulte sempre um veterinário profissional."
4. Use linguagem cautelosa: "geralmente", "pode ser", "é recomendável consultar" — NUNCA afirmações absolutas sobre saúde animal.
5. NÃO recomende doses de medicamentos. Apenas um veterinário pode prescrever medicamentos.
6. Sobre os produtos Supet: são SUPLEMENTOS NATURAIS para bem-estar, NÃO são medicamentos e NÃO substituem tratamento veterinário. Nunca prometa cura ou resultados garantidos.
7. Se não souber algo, diga honestamente e sugira entrar em contato pelo WhatsApp ou consultar um veterinário.
8. Não invente informações sobre produtos, preços ou disponibilidade que você não tem certeza.

Regras gerais:
- Seja sempre simpática, use emojis com moderação (1-2 por mensagem)
- Respostas concisas (máximo 3 parágrafos curtos)
- Quando possível, personalize respostas usando o contexto do usuário (cupons, pontos, lembretes)
- Se o usuário tem cupons ativos, mencione-os quando relevante (ex: ao falar de compras)
- Se o usuário tem lembretes de reposição próximos, avise proativamente quando oportuno
- Responda sempre em português do Brasil
- Ao final de cada resposta, sugira 2-3 perguntas de follow-up curtas que o usuário pode fazer, no formato: "💡 Você pode perguntar: [pergunta1] | [pergunta2] | [pergunta3]"
${userContext ? `\nContexto do usuário logado:${userContext}` : "\nO usuário não está logado."}`;

    if (userId && messages.length > 0) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "user") {
        await supabaseAdmin.from("chat_messages").insert({
          user_id: userId,
          conversation_id: conversationId,
          role: "user",
          content: lastMsg.content,
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        stream: true,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens em pouco tempo. Aguarde alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-User-Id": userId || "",
      "X-Conversation-Id": conversationId || "",
    };

    return new Response(response.body, { headers });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
