

# Plano: CRM Completo + Marketing & Campanhas no Admin

## Resumo

Implementar dois novos modulos completos no painel admin: um CRM para gestao avancada de clientes e um modulo de Marketing para campanhas e segmentacao.

---

## Fase 1 — CRM Completo

### Banco de dados (migracao)

- Tabela `customer_notes` — notas internas por cliente (user_id, admin_id, content, created_at)
- Tabela `customer_tags` — tags para segmentacao (id, name, color)
- Tabela `customer_tag_assignments` — relacao N:N entre profiles e tags
- Tabela `customer_interactions` — historico de interacoes (tipo: compra, contato, suporte, nota; referencia ao cliente)
- Coluna `status` na tabela `profiles` ou tabela separada `customer_status` para funil (lead, ativo, inativo, VIP)
- RLS: admins podem ler/escrever tudo; usuarios comuns sem acesso

### Pagina /admin/crm

- **Visao geral do funil**: cards com contagem por status (Lead, Ativo, Inativo, VIP) com drag-and-drop ou clique para alterar
- **Lista de clientes enriquecida**: tabela com nome, tags (badges coloridos), total gasto, ultimo pedido, status no funil, pontos
- **Filtros avancados**: por tag, status, faixa de gasto, periodo de cadastro
- **Ficha do cliente (drawer/modal)**: ao clicar em um cliente abre painel lateral com:
  - Dados do perfil + pets cadastrados
  - Timeline de interacoes (pedidos, notas, mudancas de status)
  - Notas internas (textarea para admin adicionar)
  - Tags editaveis (adicionar/remover)
  - Metricas individuais (LTV, frequencia de compra, ticket medio)

### Sidebar do admin

- Adicionar item "CRM" com icone `ContactRound` entre Clientes e Fidelizacao

---

## Fase 2 — Marketing & Campanhas

### Banco de dados (migracao)

- Tabela `campaigns` — (id, name, type: coupon/notification, segment_filter jsonb, status: draft/active/completed, message, coupon_id nullable, created_at, sent_at)
- Tabela `campaign_recipients` — (campaign_id, user_id, sent_at, opened boolean)

### Pagina /admin/marketing

- **Dashboard de campanhas**: lista de campanhas com status, destinatarios, taxa de abertura
- **Criar campanha**:
  - Selecionar segmento (por tag, status do funil, faixa de gasto, sem compra ha X dias)
  - Preview de quantos clientes serao atingidos
  - Tipo: enviar notificacao in-app e/ou gerar cupom automatico
  - Agendar ou enviar imediatamente
- **Metricas**: conversao (quantos usaram cupom), alcance (notificacoes lidas)

### Sidebar do admin

- Adicionar item "Marketing" com icone `Megaphone` apos Fidelizacao

---

## Rotas

- `/admin/crm` — nova rota protegida por AdminRoute
- `/admin/marketing` — nova rota protegida por AdminRoute

---

## Detalhes tecnicos

- Todas as tabelas com RLS restrito a admins (usando `has_role`)
- Segmentacao de clientes via queries dinamicas no Supabase (filtros compostos)
- Notificacoes de campanhas inseridas em `user_notifications` em batch via edge function
- Cupons de campanha criados em `user_coupons` vinculados a campanha
- UI segue o design system existente: cards rounded-3xl, cores primary/emerald/violet, font-display, framer-motion animations
- Componentes reutilizam padroes do AdminLayout, skeletons e motion existentes

