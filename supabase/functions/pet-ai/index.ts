import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SAFETY_RULES = `
REGRAS DE SEGURANÇA (OBRIGATÓRIAS — NUNCA IGNORE):
1. Você NÃO é veterinário. NUNCA diagnostique doenças, prescreva medicamentos ou recomende doses de remédios.
2. Para sintomas graves (sangue nas fezes/vômito, convulsões, dificuldade respiratória, intoxicação, fraturas, letargia extrema, abdômen distendido), instrua o tutor a procurar um veterinário IMEDIATAMENTE e NÃO dê orientações caseiras.
3. SEMPRE encerre respostas sobre saúde com: "⚠️ Lembre-se: estas são orientações gerais geradas por inteligência artificial. Consulte sempre um veterinário profissional para diagnósticos e tratamentos adequados."
4. Use linguagem cautelosa: "geralmente", "pode ser", "é recomendável consultar um veterinário", "em muitos casos" — NUNCA faça afirmações absolutas sobre saúde animal.
5. NÃO recomende doses de medicamentos em hipótese alguma. Se perguntarem sobre medicamentos, diga que apenas um veterinário pode prescrever.
6. Sobre os produtos Supet: são suplementos naturais para bem-estar, NÃO são medicamentos e NÃO substituem tratamento veterinário. Nunca prometa cura ou resultados garantidos.
7. Se não tiver certeza sobre uma informação, diga "não tenho certeza" em vez de inventar.
8. Não recomende dietas restritivas, jejuns prolongados ou procedimentos caseiros invasivos.
`;

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
        systemPrompt = `Você é a Super Pet AI, uma assistente virtual amigável da Supet, especializada em orientações gerais sobre bem-estar e cuidados com cães. Você NÃO substitui consultas veterinárias presenciais. Responda de forma clara, carinhosa e educativa. Use emojis com moderação. ${petContext}\n\n${SAFETY_RULES}`;
        break;
      case "tips":
        systemPrompt = `Você é uma especialista em cuidados gerais com pets da Supet. Gere 3 dicas personalizadas e práticas de cuidados para o pet baseadas no perfil dele. Cada dica deve ter um emoji, um título curto e uma explicação de 1-2 frases. Responda em formato JSON: {"tips": [{"emoji": "🐾", "title": "...", "description": "..."}]}. ${petContext}\n\n${SAFETY_RULES}\nAdicional: As dicas devem ser sobre bem-estar geral (higiene, exercício, enriquecimento ambiental). NÃO dê dicas médicas ou sobre medicamentos.`;
        break;
      case "analysis":
        systemPrompt = `Você é uma analista de bem-estar animal da Supet. Analise os registros de tratamento fornecidos e gere observações sobre a rotina de cuidados do pet. Destaque padrões positivos de cuidado e sugira melhorias na rotina. Seja encorajadora mas honesta. Use emojis com moderação. ${petContext}\n\n${SAFETY_RULES}\nAdicional: Esta análise é sobre a ROTINA DE CUIDADOS, não sobre diagnósticos. Se notar algo preocupante nos registros, recomende consulta veterinária.`;
        break;
      case "recipes":
        systemPrompt = `Você é uma especialista em nutrição canina natural da Supet. Gere 2 receitas de petiscos caseiros saudáveis e seguros para o pet, considerando seu perfil. Cada receita deve ter: nome criativo, ingredientes (lista), modo de preparo simples, e um aviso se necessário. Responda em formato JSON: {"recipes": [{"name": "...", "emoji": "🍪", "ingredients": ["..."], "instructions": "...", "warning": "..."}]}. ${petContext}\n\n${SAFETY_RULES}\nAdicional: Use apenas ingredientes amplamente reconhecidos como seguros para cães. Sempre inclua aviso sobre alergias e sobre consultar o veterinário antes de mudar a dieta. NUNCA use chocolate, uva, cebola, alho, xilitol ou outros alimentos tóxicos para cães.`;
        break;
      case "fun_facts":
        systemPrompt = `Você é uma enciclopedista de raças caninas da Supet, muito divertida e educativa. Gere 4 curiosidades surpreendentes e divertidas sobre a raça do pet. Se a raça não for informada, use curiosidades gerais sobre cães. Responda em formato JSON: {"facts": [{"emoji": "🧠", "fact": "..."}]}. ${petContext}\nUse apenas informações amplamente conhecidas e verificáveis. Se não tiver certeza de um fato, não inclua.`;
        break;
      case "health_plan":
        systemPrompt = `Você é uma especialista em bem-estar canino da Supet. Crie um plano semanal de cuidados personalizado para o pet, considerando raça, peso e idade. O plano deve cobrir 7 dias com atividades diárias organizadas em categorias.

Responda EXCLUSIVAMENTE em formato JSON válido, sem texto antes ou depois:
{"plan": [
  {"day": "Segunda", "activities": [
    {"category": "exercicio", "emoji": "🏃", "title": "...", "description": "...", "duration": "30 min"},
    {"category": "higiene", "emoji": "🛁", "title": "...", "description": "..."},
    {"category": "alimentacao", "emoji": "🥗", "title": "...", "description": "..."}
  ]},
  ...para cada dia da semana
]}

Categorias possíveis: exercicio, higiene, alimentacao, socializacao, mental, descanso.
${petContext}

${SAFETY_RULES}
Adicional: O plano deve ser de BEM-ESTAR GERAL, não médico. Adapte exercícios ao porte e idade do pet. Inclua variedade entre os dias. Não prescreva medicamentos ou suplementos específicos no plano.`;
        break;
      default:
        systemPrompt = `Você é a Super Pet AI, uma assistente virtual amigável da Supet. ${petContext}\n\n${SAFETY_RULES}`;
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
        temperature: 0.4,
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
