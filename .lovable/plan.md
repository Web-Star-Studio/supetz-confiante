

# Plano: CRM Inteligente com Scoring e Follow-up

## Resumo

Unificar a rota /admin/clientes (redirect) com /admin/crm, renomear para "Clientes" na sidebar, e adicionar recursos inteligentes: scoring de clientes, automações de follow-up, e analytics avançado.

## Etapas

### 1. Remover redirect /admin/clientes e manter apenas /admin/crm

- Em `AnimatedRoutes.tsx`: remover a linha `<Route path="/admin/clientes" element={<Navigate to="/admin/crm" replace />} />`
- A sidebar já aponta para `/admin/crm` com label "Clientes" -- sem mudanças necessarias

### 2. Reorganizar CRM.tsx em abas

Transformar o modulo em interface com tabs:
- **Clientes** (aba atual com lista, funil, filtros, bulk actions)
- **Scoring** (nova aba)
- **Follow-up** (nova aba)
- **Analytics** (nova aba)

### 3. Aba Scoring -- Customer Scoring Inteligente

Calcular um score automatico (0-100) para cada cliente baseado em:
- **Recencia** (25pts): dias desde ultimo pedido
- **Frequencia** (25pts): numero de pedidos
- **Monetario** (25pts): gasto total
- **Engajamento** (25pts): pontos de fidelidade, pets cadastrados, cupons usados

Exibir:
- Distribuicao de scores em faixas (0-20 Frio, 21-40 Morno, 41-60 Quente, 61-80 Premium, 81-100 Diamante)
- Top 10 clientes por score
- Clientes com score em queda (comparando com dados de pedidos)
- Badges visuais por faixa

### 4. Aba Follow-up -- Automacoes de Follow-up

Detectar automaticamente oportunidades de follow-up:
- **Carrinho abandonado**: clientes que nao compram ha X dias (configuravel)
- **Pos-compra**: clientes que compraram nos ultimos 7 dias sem review
- **Reativacao**: clientes inativos ha mais de 60 dias com historico de compras
- **Upsell**: clientes com apenas 1 pedido e gasto alto
- **Aniversario do pet**: pets com aniversario proximo (7 dias)

Para cada oportunidade: botao de acao rapida (enviar notificacao ou cupom individual).

### 5. Aba Analytics -- Metricas de Clientes

Graficos com Recharts:
- **Crescimento da base**: novos clientes por mes (ultimos 6 meses)
- **Distribuicao por status**: pie chart (Lead, Ativo, Inativo, VIP)
- **Cohort simplificado**: taxa de retencao (% clientes que fizeram 2+ pedidos)
- **Ticket medio por faixa de score**

KPIs: LTV medio, taxa de retencao, churn rate, NPS estimado

### 6. Arquivos modificados

- `src/pages/admin/CRM.tsx` -- reorganizar em tabs, adicionar scoring/follow-up/analytics inline
- `src/components/layout/AnimatedRoutes.tsx` -- remover redirect /admin/clientes

### Detalhes Tecnicos

- Scoring calculado client-side com dados ja carregados (profiles, orders, loyalty_points, pets, user_coupons)
- Follow-ups detectados por queries aos dados existentes, sem novas tabelas
- Graficos com Recharts (ja disponivel no projeto)
- Nenhuma migracao de banco necessaria

