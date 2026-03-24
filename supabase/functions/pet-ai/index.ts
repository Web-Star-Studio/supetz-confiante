import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMERGENCY_KEYWORDS = [
  "convulsao", "convulsão", "convulsoes", "convulsões",
  "sangue nas fezes", "sangue no vomito", "sangue no vômito", "vomitando sangue", "fezes com sangue",
  "nao respira", "não respira", "parou de respirar", "dificuldade respiratoria", "dificuldade respiratória",
  "envenenamento", "envenenado", "intoxicacao", "intoxicação", "ingeriu veneno", "comeu veneno",
  "fratura", "osso quebrado", "pata quebrada",
  "desacordado", "desmaiou", "inconsciente", "desmaio",
  "engasgou", "engasgando", "engasgo",
  "nao consegue andar", "não consegue andar", "nao anda", "não anda",
  "paralisia", "paralisado", "paralisada",
  "abdomen inchado", "abdômen inchado", "barriga inchada", "torcao gastrica", "torção gástrica",
  "olho saltado", "olho saindo",
  "picada de cobra", "mordida de cobra",
  "atropelado", "atropelada", "queda de altura",
  "hemorragia", "sangrando muito",
];

const EMERGENCY_RESPONSE = `🚨 **EMERGÊNCIA DETECTADA**

A situação que você descreveu pode ser uma **emergência veterinária**.
**NÃO siga orientações de IA neste caso.**

👉 Leve seu pet **IMEDIATAMENTE** ao veterinário ou hospital veterinário mais próximo.

📞 Se possível, ligue antes para avisar que está a caminho.

⚠️ Em emergências, cada minuto conta. A Super Pet AI **não substitui** atendimento veterinário presencial.`;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectEmergency(text: string): boolean {
  const normalized = normalizeText(text);
  return EMERGENCY_KEYWORDS.some((kw) => normalized.includes(normalizeText(kw)));
}

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

const DOG_KNOWLEDGE_BASE = `
BASE DE CONHECIMENTO — CUIDADOS CANINOS

## GRUPOS DE RAÇAS E CARACTERÍSTICAS

### Raças de Pequeno Porte (até 10kg)
- **Yorkshire Terrier**: Pelo longo sedoso, precisa de escovação diária. Propenso a problemas dentários e luxação patelar. Energia moderada, 20-30min de exercício/dia.
- **Shih Tzu**: Braquicefálico (focinho curto), sensível ao calor. Pelo longo precisa de manutenção constante. Propenso a problemas oculares e respiratórios.
- **Pinscher Miniatura**: Muito ativo apesar do tamanho. Sensível ao frio (precisa de roupinha no inverno). Propenso a luxação patelar e problemas dentários.
- **Maltês**: Pelo branco que mancha facilmente. Hipoalergênico. Propenso a manchas de lágrima e problemas dentários.
- **Chihuahua**: Menor raça do mundo. Moleira pode não fechar completamente. Propenso a hipoglicemia e problemas dentários.
- **Pomerânia/Spitz Alemão**: Pelagem dupla e densa, troca intensa de pelos. Propenso a luxação patelar e alopecia.
- **Lhasa Apso**: Pelo longo e denso, escovação frequente. Propenso a problemas renais e oculares. Independente mas leal.
- **Pug**: Braquicefálico, muito sensível ao calor. Propenso a problemas respiratórios, oculares e de pele (dobras faciais precisam de limpeza).

### Raças de Médio Porte (10-25kg)
- **Bulldog Francês**: Braquicefálico, não tolera calor nem exercício intenso. Propenso a alergias de pele, problemas respiratórios e de coluna.
- **Beagle**: Muito olfativo e curioso. Propenso a obesidade, otite (orelhas longas) e epilepsia. Precisa de bastante exercício.
- **Cocker Spaniel**: Orelhas longas propensas a otite. Precisa de escovação frequente. Propenso a problemas oculares e de ouvido.
- **Border Collie**: Extremamente inteligente, precisa de estímulo mental diário. Propenso a displasia de quadril e problemas oculares.
- **SRD (Sem Raça Definida)**: Geralmente mais saudáveis por vigor híbrido. Cada indivíduo é único. Importante avaliar porte estimado para adequar alimentação.

### Raças de Grande Porte (25-45kg)
- **Golden Retriever**: Dócil e familiar. Propenso a displasia de quadril/cotovelo, problemas cardíacos e câncer. Precisa de exercício moderado a alto.
- **Labrador Retriever**: Muito ativo, adora água. Altamente propenso a obesidade. Propenso a displasia e problemas articulares.
- **Pastor Alemão**: Inteligente e versátil. Propenso a displasia de quadril, problemas digestivos e dermatite.
- **Rottweiler**: Forte e protetor. Propenso a displasia, problemas cardíacos e osteossarcoma. Socialização precoce importante.
- **Boxer**: Braquicefálico de grande porte. Propenso a cardiomiopatia, câncer e problemas digestivos.
- **Pit Bull (American Pit Bull Terrier)**: Forte e atlético. Propenso a alergias de pele e displasia. Precisa de socialização e exercício intenso.
- **Husky Siberiano**: Pelagem dupla densa, sofre muito com calor no Brasil. Precisa de exercício intenso. Propenso a problemas oculares e de pele.

### Raças Gigantes (acima de 45kg)
- **Dogue Alemão**: Maior raça do mundo. Expectativa de vida curta (6-8 anos). Propenso a torção gástrica, cardiomiopatia e problemas articulares.
- **São Bernardo**: Pelagem densa, sofre com calor. Propenso a displasia, problemas cardíacos e de pele.
- **Mastiff/Mastim**: Gigante e calmo. Propenso a displasia, torção gástrica e problemas articulares.

## NUTRIÇÃO CANINA

### Alimentos SEGUROS para cães
- Frutas: banana, maçã (sem sementes), melancia (sem sementes), manga, morango, blueberry, pera
- Legumes: cenoura, batata-doce cozida, abóbora cozida, brócolis (pouca quantidade), pepino, abobrinha
- Proteínas: frango cozido sem tempero, peito de peru, ovos cozidos, peixe cozido (sem espinhas)
- Outros: arroz, aveia cozida, pasta de amendoim (sem xilitol)

### Alimentos TÓXICOS para cães (NUNCA oferecer)
- **Chocolate**: Contém teobromina, tóxico mesmo em pequenas quantidades. Chocolate amargo é o mais perigoso.
- **Uva e passa**: Podem causar insuficiência renal aguda mesmo em pequenas quantidades.
- **Cebola e alho**: Danificam os glóbulos vermelhos, causando anemia hemolítica.
- **Xilitol**: Adoçante presente em chicletes, balas e alguns alimentos. Causa hipoglicemia grave e insuficiência hepática.
- **Macadâmia**: Causa vômito, tremores e hipertermia.
- **Abacate**: A persina pode causar problemas gastrointestinais.
- **Cafeína**: Pode causar arritmia cardíaca e convulsões.
- **Álcool**: Tóxico mesmo em pequenas doses.
- **Ossos cozidos**: Podem estilhaçar e causar perfuração intestinal.

### Orientações gerais de alimentação
- Filhotes (2-6 meses): 3-4 refeições/dia
- Filhotes (6-12 meses): 2-3 refeições/dia
- Adultos: 2 refeições/dia
- Idosos: 2-3 refeições menores/dia
- Quantidade varia com peso, idade, nível de atividade e metabolismo
- Transição alimentar deve ser gradual (7-10 dias)

## CUIDADOS POR FASE DA VIDA

### Filhotes (0-12 meses)
- Vacinação: V8/V10, antirrábica (consultar veterinário para calendário)
- Socialização: Período crítico entre 3-16 semanas
- Vermifugação regular (a cada 2-4 semanas até 3 meses, depois mensal até 6 meses)
- Não passear em locais públicos antes da vacinação completa
- Treinamento básico desde cedo: nome, sentar, ficar

### Adultos (1-7 anos)
- Check-up veterinário anual
- Vacinação de reforço conforme orientação veterinária
- Exercício adequado ao porte e raça
- Escovação dos dentes 2-3x por semana
- Controle de peso regular
- Vermifugação e controle de pulgas/carrapatos regular

### Idosos (7+ anos, gigantes 5+ anos)
- Check-up veterinário semestral
- Atenção a sinais de artrite: dificuldade para levantar, claudicação
- Alimentação adequada para idosos (menos calórica, suporte articular)
- Exercício mais leve e frequente
- Atenção a mudanças comportamentais (podem indicar disfunção cognitiva)
- Rampas para subir/descer de móveis

## HIGIENE E CUIDADOS

### Banho
- Frequência geral: a cada 15-30 dias (varia com raça e estilo de vida)
- Usar shampoo específico para cães (pH da pele canina é diferente)
- Secar bem, especialmente orelhas e dobras de pele
- Raças com dobras (Bulldog, Shar-Pei): limpar dobras regularmente

### Escovação
- Pelos curtos: 1-2x por semana
- Pelos médios: 2-3x por semana
- Pelos longos: diariamente
- Período de troca de pelo: escovação diária para todas as raças

### Unhas
- Cortar a cada 2-4 semanas
- Atenção ao sabugo (veia interna da unha)
- Unhas compridas causam problemas posturais e podem encravar

### Dentes
- Escovação 2-3x por semana com pasta canina
- Nunca usar pasta de dente humana (flúor é tóxico)
- Petiscos dentais podem ajudar, mas não substituem escovação
- Limpeza profissional anual recomendada

### Orelhas
- Limpeza semanal com produto específico
- Raças de orelha caída: mais propensas a otite, limpar com mais frequência
- Nunca usar cotonete dentro do canal auditivo

## BEM-ESTAR E COMPORTAMENTO

### Sinais de estresse em cães
- Lamber os lábios excessivamente, bocejar fora de contexto
- Orelhas para trás, rabo entre as pernas
- Arquejar sem calor ou exercício
- Morder/lamber patas compulsivamente
- Destruir objetos, latir excessivamente
- Esconder-se, evitar contato

### Enriquecimento ambiental
- Brinquedos interativos (Kong, tapete de lamber)
- Passeios com tempo para farejar
- Treinamento com reforço positivo
- Rodízio de brinquedos
- Brincadeiras de buscar e puxar

### Exercício por porte
- Pequeno porte: 20-40 min/dia de caminhadas leves e brincadeiras
- Médio porte: 40-60 min/dia de caminhadas e atividades
- Grande porte: 60-90 min/dia de exercício variado
- Gigantes: 30-60 min/dia (exercício moderado, sem impacto excessivo em filhotes)
- Braquicefálicos: exercício leve, evitar calor, pausas frequentes

## PRIMEIROS SOCORROS BÁSICOS (orientações gerais, sempre consultar veterinário)
- Cortes superficiais: lavar com soro fisiológico, pressionar com gaze limpa
- Queimaduras: resfriar com água corrente, não aplicar pomadas caseiras
- Engasgo: NÃO tentar manobra de Heimlich sem orientação veterinária
- Golpe de calor: molhar com água fresca (não gelada), ventilar, ir ao veterinário
- Picada de inseto: observar inchaço e reação alérgica, ir ao veterinário se necessário
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { mode, messages, petInfo } = await req.json();

    // Emergency filter — check last user message before calling AI
    const lastUserMsg = messages ? [...messages].reverse().find((m: any) => m.role === "user") : null;
    if (lastUserMsg && detectEmergency(lastUserMsg.content)) {
      const isStreamMode = mode === "assistant" || mode === "analysis";
      if (isStreamMode) {
        // Return as SSE for streaming modes
        const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: "" } }], isEmergency: true })}\n\ndata: [DONE]\n\n`;
        return new Response(JSON.stringify({ isEmergency: true, content: EMERGENCY_RESPONSE }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ isEmergency: true, content: EMERGENCY_RESPONSE }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
