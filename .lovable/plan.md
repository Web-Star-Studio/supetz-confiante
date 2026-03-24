

## Plano: Melhorias de Seguranca e Inteligencia na Super Pet AI e Super IA

### Problema

Os prompts atuais das duas IAs (pet-ai e chatbot) nao possuem disclaimers legais robustos. A IA pode gerar informacoes incorretas sobre saude animal sem avisos adequados, expondo a empresa a riscos juridicos.

### Alteracoes

#### 1. Edge Function `supabase/functions/pet-ai/index.ts`

Reescrever todos os system prompts com regras de seguranca:

- **Disclaimer obrigatorio**: Toda resposta deve terminar com aviso de que e gerada por IA e nao substitui consulta veterinaria
- **Proibicoes explicitas**: Nao diagnosticar doencas, nao prescrever medicamentos, nao recomendar dosagens de remedios
- **Linguagem cautelosa**: Usar "pode ser", "consulte um veterinario", "geralmente recomenda-se" em vez de afirmacoes absolutas
- **Recusa ativa**: Se o usuario descrever emergencia (vomito com sangue, convulsao, etc), a IA deve recusar dar conselho e mandar ir ao veterinario imediatamente
- **Renomear** de "SuperPet AI" para "Super Pet AI" (consistencia com o nome pedido)
- Adicionar regra de temperatura conservadora no prompt (evitar respostas criativas demais em saude)

Exemplo de bloco de seguranca adicionado a todos os prompts:

```
REGRAS DE SEGURANÇA (OBRIGATÓRIAS):
1. Você NÃO é veterinário. NUNCA diagnostique doenças ou prescreva medicamentos.
2. Para sintomas graves (sangue, convulsões, dificuldade respiratória, intoxicação), instrua o tutor a procurar um veterinário IMEDIATAMENTE.
3. Sempre encerre respostas sobre saúde com: "⚠️ Lembre-se: estas são orientações gerais de uma IA. Consulte sempre um veterinário para diagnósticos e tratamentos."
4. Use linguagem como "geralmente", "pode ser", "é recomendável consultar" — nunca afirmações absolutas sobre saúde.
5. Não recomende doses de medicamentos em hipótese alguma.
6. Sobre os produtos Supet, seja honesto: são suplementos naturais, NÃO são medicamentos.
```

#### 2. Edge Function `supabase/functions/chatbot/index.ts`

Mesmo tratamento de seguranca no system prompt do chatbot Super IA:
- Adicionar bloco de regras de seguranca similar
- Reforcar que produtos Supet sao suplementos naturais, nao medicamentos
- Instruir a IA a nunca fazer promessas de cura

#### 3. Frontend `src/components/profile/AIPetAssistantTab.tsx`

- Renomear "SuperPet AI" para "Super Pet AI" no header (linha 272)
- Adicionar disclaimer visual fixo abaixo do chat e de cada modo:
  - Banner discreto: "⚠️ Informacoes geradas por IA. Consulte sempre um veterinario profissional."
- Atualizar texto de boas-vindas com aviso inicial

#### 4. Frontend `src/components/chat/FloatingChatbot.tsx`

- Adicionar disclaimer visual no rodape do chat (acima do input)
- Texto: "As respostas sao geradas por IA e podem conter imprecisoes."

### Detalhes tecnicos

- Nenhuma alteracao no banco de dados
- Apenas edicao de 4 arquivos existentes
- Prompts mais longos mas necessarios para protecao legal

