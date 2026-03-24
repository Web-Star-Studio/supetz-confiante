import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, payload } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_article": {
        systemPrompt = `Você é uma redatora veterinária especialista em saúde animal, escrevendo para o blog da Supet (suplemento natural para cães).
Gere artigos em português brasileiro, informativos, com tom acolhedor e profissional.
Retorne APENAS um JSON válido (sem markdown) com a estrutura:
{
  "title": "string",
  "excerpt": "string (max 160 chars)",
  "category": "string (uma de: Saúde da Pele, Imunidade, Nutrição, Alergias, Bem-estar, Guia Prático)",
  "tags": ["string"],
  "read_time": number,
  "content": [
    { "type": "heading", "content": "string", "level": 2 },
    { "type": "paragraph", "content": "string" },
    { "type": "list", "items": ["string"] },
    { "type": "quote", "content": "string" }
  ]
}
Gere pelo menos 6-8 blocos de conteúdo com informações ricas e úteis.`;
        userPrompt = `Gere um artigo completo sobre: ${payload.topic}`;
        break;
      }

      case "improve_text": {
        systemPrompt = `Você é uma editora de conteúdo veterinário. Melhore o texto mantendo o tom profissional e acolhedor. Retorne APENAS o texto melhorado, sem explicações.`;
        userPrompt = `Melhore este texto:\n\n${payload.text}`;
        break;
      }

      case "generate_excerpt": {
        systemPrompt = `Você é uma copywriter especialista em SEO para conteúdo pet. Gere um resumo atrativo com no máximo 160 caracteres. Retorne APENAS o texto do resumo.`;
        userPrompt = `Gere um excerpt/resumo SEO para este artigo:\n\nTítulo: ${payload.title}\n\nConteúdo: ${payload.content}`;
        break;
      }

      case "suggest_tags": {
        systemPrompt = `Você sugere tags relevantes para artigos sobre saúde animal. Retorne APENAS um JSON array de strings com 4-6 tags. Ex: ["dermatite","coceira","pele"]`;
        userPrompt = `Sugira tags para:\n\nTítulo: ${payload.title}\nCategoria: ${payload.category}\nExcerpt: ${payload.excerpt}`;
        break;
      }

      case "generate_seo_title": {
        systemPrompt = `Você é especialista em SEO para conteúdo pet. Gere 3 opções de título SEO-friendly (máx 60 chars cada). Retorne APENAS um JSON array de strings.`;
        userPrompt = `Gere títulos SEO para um artigo sobre: ${payload.topic}\n\nConteúdo atual: ${payload.excerpt || ""}`;
        break;
      }

      case "expand_block": {
        systemPrompt = `Você é redatora veterinária. Expanda o conteúdo do bloco de texto a seguir com mais detalhes, mantendo o tom profissional. Retorne APENAS o texto expandido.`;
        userPrompt = `Expanda este conteúdo:\n\n${payload.text}`;
        break;
      }

      case "generate_conclusion": {
        systemPrompt = `Você é redatora veterinária do blog Supet. Gere uma conclusão para o artigo a seguir. Retorne APENAS o texto da conclusão (1-2 parágrafos).`;
        userPrompt = `Gere uma conclusão para:\n\nTítulo: ${payload.title}\nConteúdo: ${payload.content}`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em breve." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
