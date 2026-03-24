

## Plano: Sistema de Moderacao com Filtro de Emergencia Pre-IA

### O que sera feito

Adicionar uma camada de moderacao **antes** de enviar a mensagem ao modelo de IA. Quando palavras-chave de emergencia forem detectadas na mensagem do usuario, o sistema retorna uma resposta imediata e padronizada orientando a procurar um veterinario, **sem consumir tokens da IA**.

### Logica

Uma lista de palavras/frases de emergencia (ex: "convulsao", "sangue nas fezes", "nao respira", "envenenamento", "intoxicacao", "fratura", "desacordado", "engasgou", "nao consegue andar") sera verificada contra a ultima mensagem do usuario. Se houver match, retorna resposta fixa imediata.

### Arquivos alterados

#### 1. `supabase/functions/chatbot/index.ts`
- Adicionar constante `EMERGENCY_KEYWORDS` (array de strings)
- Adicionar funcao `detectEmergency(text)` que normaliza o texto (lowercase, remove acentos) e verifica matches
- Apos parsear o JSON do request, antes de chamar a IA, rodar `detectEmergency` na ultima mensagem do usuario
- Se detectada emergencia: retornar resposta JSON fixa com mensagem de alerta (sem chamar a IA gateway)
- A resposta fixa inclui: orientacao para ir ao veterinario imediatamente, numero de emergencia animal se disponivel, e disclaimer

#### 2. `supabase/functions/pet-ai/index.ts`
- Mesmo tratamento: adicionar `EMERGENCY_KEYWORDS` e `detectEmergency`
- Aplicar filtro antes de chamar a IA, em todos os modos (assistant, tips, analysis, etc.)
- Retornar resposta estruturada de emergencia compativel com o formato esperado pelo frontend

#### 3. `src/components/chat/FloatingChatbot.tsx`
- Detectar quando a resposta vem do filtro de emergencia (flag `isEmergency` no JSON)
- Renderizar a mensagem de emergencia com destaque visual (borda vermelha, icone de alerta)

#### 4. `src/components/profile/AIPetAssistantTab.tsx`
- Mesmo tratamento visual para respostas de emergencia no modo assistant

### Palavras-chave de emergencia (lista inicial)

```text
convulsão, convulsao, sangue nas fezes, sangue no vômito, sangue no vomito,
não respira, nao respira, envenenamento, envenenado, intoxicação, intoxicacao,
fratura, osso quebrado, desacordado, desmaiou, engasgou, engasgando,
não consegue andar, nao consegue andar, paralisia, paralisado,
abdômen inchado, abdomen inchado, barriga inchada, olho saltado,
picada de cobra, mordida de cobra, atropelado, queda de altura
```

### Resposta fixa de emergencia

```
🚨 EMERGÊNCIA DETECTADA

A situação que você descreveu pode ser uma emergência veterinária.
NÃO siga orientações de IA neste caso.

👉 Leve seu pet IMEDIATAMENTE ao veterinário ou hospital veterinário mais próximo.

📞 Se possível, ligue antes para avisar que está a caminho.

⚠️ Em emergências, cada minuto conta. A Super IA não substitui atendimento veterinário presencial.
```

### Detalhes tecnicos

- Nenhuma alteracao no banco de dados
- Filtro roda server-side (edge functions) — nao depende do frontend
- Normalizacao de texto com remoção de acentos para evitar bypass
- Funcao pura sem dependencias externas

