

## Plano: Remover formatacao markdown das sugestoes do chatbot

### Problema

As sugestoes de follow-up extraidas da resposta da IA contem markdown (`**texto**`) mas sao renderizadas como texto puro nos chips de sugestao, mostrando os asteriscos literais.

### Solucao

Duas correcoes complementares:

**1. `src/components/chat/FloatingChatbot.tsx`** — Sanitizar sugestoes no `extractSuggestions`
- Remover `**`, `*`, `__`, `_` e outros caracteres markdown das strings de sugestao antes de exibi-las

**2. `supabase/functions/chatbot/index.ts`** — Ajustar o system prompt
- Na instrucao sobre sugestoes de follow-up, explicitar que as perguntas sugeridas devem ser texto puro, sem markdown, sem negrito, sem formatacao

**3. `supabase/functions/pet-ai/index.ts`** — Mesmo ajuste no prompt (se aplicavel)

### Detalhes tecnicos

No `extractSuggestions`, adicionar uma funcao de limpeza:
```typescript
function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '').trim();
}
```

No system prompt, alterar a linha de sugestoes para:
```
"💡 Você pode perguntar: [pergunta1] | [pergunta2] | [pergunta3]"
As perguntas de follow-up devem ser texto puro, SEM markdown, SEM negrito, SEM asteriscos.
```

