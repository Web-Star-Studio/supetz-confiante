

## Plano: Melhorias de Inteligencia na IA da Supet

### Melhorias planejadas

#### 1. Super Pet AI — Novo modo "Plano de Saude" (edge function + frontend)
Adicionar um 6o modo chamado `health_plan` que gera um plano semanal de cuidados personalizado para o pet (exercicios, higiene, alimentacao) baseado na raca, peso e idade. Retorna JSON estruturado.

#### 2. Contexto mais rico no chatbot (edge function)
O chatbot Super IA atualmente carrega perfil, pets e pedidos. Adicionar tambem:
- Cupons ativos do usuario (para poder informar sobre descontos disponiveis)
- Pontos de fidelidade acumulados
- Lembretes de reposicao proximos

Isso permite respostas como "Voce tem 150 pontos e um cupom de 10% ativo!"

#### 3. Sugestoes contextuais pos-resposta (frontend chatbot)
Apos cada resposta da Super IA, mostrar 2-3 botoes de follow-up gerados com base no contexto (ex: "Saber mais", "Ver produtos", "Dosagem para meu pet"). Implementado com chips clicaveis abaixo da mensagem.

#### 4. Historico de conversas persistente (frontend chatbot)
Ao abrir o chat, carregar as ultimas mensagens da conversa anterior do banco (tabela `chat_messages`) para que o usuario nao perca contexto entre sessoes.

#### 5. Avatar da veterinaria na Super Pet AI (frontend)
Usar o mesmo avatar `supet-ia-avatar.png` ja criado no header da Super Pet AI (atualmente usa icone generico Sparkles).

### Arquivos alterados

1. **`supabase/functions/chatbot/index.ts`** — Adicionar queries de cupons, pontos e lembretes ao contexto do usuario
2. **`supabase/functions/pet-ai/index.ts`** — Adicionar modo `health_plan` com prompt e schema JSON
3. **`src/components/chat/FloatingChatbot.tsx`** — Carregar historico ao abrir; adicionar sugestoes pos-resposta
4. **`src/components/profile/AIPetAssistantTab.tsx`** — Adicionar modo "Plano de Saude" no seletor; usar avatar da veterinaria no header

### Detalhes tecnicos

- Nenhuma alteracao no banco de dados (tabelas e RLS ja existem)
- Edge functions redeployadas automaticamente
- Historico carregado com query limitada a 20 mensagens mais recentes do `conversation_id` mais recente

