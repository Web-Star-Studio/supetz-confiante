

# Sistema de Feedback da Super IA — Plano de Implementacao

## Resumo

Implementar um sistema de feedback completo para o chatbot Super IA com coleta estruturada, auto-correcao via prompt e painel admin de monitoramento.

## Etapas

### 1. Criar tabela `chat_feedback` (migration)

```sql
CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  message_content text NOT NULL,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  reason text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Usuario insere proprio feedback
CREATE POLICY "Users can insert own feedback"
  ON public.chat_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuario le proprio feedback
CREATE POLICY "Users can view own feedback"
  ON public.chat_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin le todos
CREATE POLICY "Admins can view all feedback"
  ON public.chat_feedback FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

Sem UPDATE/DELETE — feedbacks sao imutaveis.

### 2. Atualizar Frontend (`FloatingChatbot.tsx`)

**Feedback positivo (thumbs up):** Salva imediatamente na tabela `chat_feedback` com `rating: "positive"`. Mostra toast de agradecimento.

**Feedback negativo (thumbs down):** Abre formulario inline abaixo da mensagem com:
- Radio buttons com motivos pre-definidos: "Resposta incorreta", "Nao entendeu minha pergunta", "Pouco util", "Outro"
- Textarea opcional (max 300 chars) para comentario
- Botoes "Enviar feedback" e "Cancelar"

Ao submeter, salva na `chat_feedback` com `rating: "negative"`, `reason` e `comment`. Toast de agradecimento.

Dados salvos: `user_id`, `conversation_id`, `message_content` (primeiros 500 chars da resposta), `rating`, `reason`, `comment`.

Substitui o sistema atual de feedback simples (que apenas atualiza `chat_messages.feedback`) por esse sistema mais rico.

### 3. Auto-Correcao no Backend (`supabase/functions/chatbot/index.ts`)

Antes de chamar a IA, buscar os 5 feedbacks negativos mais recentes:

```sql
SELECT reason, comment, message_content
FROM chat_feedback
WHERE rating = 'negative'
ORDER BY created_at DESC
LIMIT 5
```

Injetar no system prompt como secao de auto-correcao:

```
## ⚠️ AUTO-CORREÇÃO (baseada em feedbacks recentes)
Os seguintes problemas foram reportados por usuarios:
1. Motivo: "Resposta incorreta" — "informacao sobre dosagem estava errada"
2. ...
Ajuste suas respostas para evitar esses problemas. Seja mais precisa e util.
```

### 4. Painel Admin de Feedback (`src/pages/admin/Feedback.tsx`)

Nova pagina no admin com:

**KPIs no topo:**
- Total de feedbacks
- Taxa de satisfacao (positivos / total)
- Total de negativos
- Feedbacks do dia

**Filtros:** por rating (positivo/negativo), busca textual no conteudo/comentario

**Tabela:** rating (badge), motivo, comentario, conteudo da mensagem (truncado), data

**Exportacao CSV:** botao para download com encoding UTF-8 + BOM

Adicionar link na sidebar do admin (`AdminLayout.tsx`).

### 5. Rota no App.tsx

Adicionar rota `/admin/feedback` apontando para o novo componente, protegida pelo `AdminRoute`.

## Detalhes Tecnicos

- **Tabela:** `chat_feedback` com RLS — usuarios inserem/leem proprios, admins leem todos
- **Frontend:** formulario inline com RadioGroup + Textarea do shadcn, animado com framer-motion
- **Edge Function:** query com `supabaseAdmin` (service role) para ler feedbacks globais
- **Admin:** Recharts para KPIs, tabela com paginacao e filtros, CSV via Blob download

