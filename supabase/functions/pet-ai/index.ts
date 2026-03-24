import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { mode, messages, petInfo } = await req.json();

    const petContext = petInfo
      ? `Informações do pet: Nome: ${petInfo.name}, Raça: ${petInfo.breed || "Não informada"}, Peso: ${petInfo.weight_kg ? petInfo.weight_kg + "kg" : "Não informado"}, Data de nascimento: ${petInfo.birth_date || "Não informada"}.`
      : "";

    let systemPrompt = "";

    switch (mode) {
      case "assistant":
        systemPrompt = `Você é o SuperPet AI, um assistente veterinário virtual amigável e especializado em saúde e bem-estar de cães. Você NÃO é um substituto para consultas veterinárias presenciais, e deve deixar isso claro quando apropriado. Responda de forma clara, carinhosa e educativa. Use emojis com moderação. ${petContext}`;
        break;
      case "tips":
        systemPrompt = `Você é um especialista em cuidados com pets. Gere 3 dicas personalizadas e práticas de cuidados para o pet baseadas no perfil dele. Cada dica deve ter um emoji, um título curto e uma explicação de 1-2 frases. Responda em formato JSON: {"tips": [{"emoji": "🐾", "title": "...", "description": "..."}]}. ${petContext}`;
        break;
      case "analysis":
        systemPrompt = `Você é um analista veterinário especializado. Analise os registros de tratamento fornecidos e gere insights sobre a evolução do pet. Destaque padrões positivos, alertas e recomendações. Seja encorajador mas honesto. Use emojis com moderação. ${petContext}`;
        break;
      case "recipes":
        systemPrompt = `Você é um especialista em nutrição canina natural. Gere 2 receitas de petiscos caseiros saudáveis e seguros para o pet, considerando seu perfil. Cada receita deve ter: nome criativo, ingredientes (lista), modo de preparo simples, e um aviso se necessário. Responda em formato JSON: {"recipes": [{"name": "...", "emoji": "🍪", "ingredients": ["..."], "instructions": "...", "warning": "..."}]}. ${petContext}`;
        break;
      case "fun_facts":
        systemPrompt = `Você é um enciclopedista de raças caninas muito divertido. Gere 4 curiosidades surpreendentes e divertidas sobre a raça do pet. Se a raça não for informada, use curiosidades gerais sobre cães. Responda em formato JSON: {"facts": [{"emoji": "🧠", "fact": "..."}]}. ${petContext}`;
        break;
      default:
        systemPrompt = `Você é o SuperPet AI, um assistente veterinário virtual amigável. ${petContext}`;
    }

    const isStreamMode = mode === "assistant" || mode === "analysis";

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [{ role: "user", content: "Olá!" }]),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: isStreamMode,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isStreamMode) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pet-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
