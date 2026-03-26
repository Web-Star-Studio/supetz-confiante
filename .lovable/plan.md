

## Programa de Afiliados e Influenciadores — Plano Completo

### Resumo
Criar um sistema completo de afiliados onde influenciadores, parceiros e creators recebem um cupom exclusivo e um link rastreável. Quando alguém compra usando o cupom ou link, o afiliado ganha uma comissão. Inclui painel público para o afiliado acompanhar ganhos e um módulo admin para gerenciar o programa.

### Arquitetura

```text
┌─────────────────────────────────────────────────────┐
│  FLUXO DO AFILIADO                                  │
│                                                     │
│  1. Afiliado se cadastra via /parceiros              │
│  2. Admin aprova → cupom + link gerados             │
│  3. Afiliado compartilha link (supet.com/?ref=CODE) │
│  4. Cliente compra com cupom ou via link             │
│  5. Comissão registrada automaticamente             │
│  6. Afiliado acompanha ganhos em /parceiros/painel  │
└─────────────────────────────────────────────────────┘
```

---

### 1. Banco de Dados (4 tabelas novas)

**`affiliates`** — Cadastro do afiliado
- `id`, `user_id` (ref profiles), `name`, `email`, `instagram`, `channel_type` (influencer/partner/creator), `status` (pending/active/suspended), `commission_percent` (default 10), `coupon_code` (unique), `ref_slug` (unique, para URL), `total_earned`, `created_at`, `approved_at`

**`affiliate_sales`** — Vendas atribuídas
- `id`, `affiliate_id`, `order_id`, `order_total`, `commission_amount`, `status` (pending/confirmed/paid), `created_at`

**`affiliate_payouts`** — Pagamentos realizados
- `id`, `affiliate_id`, `amount`, `method` (pix/bank), `pix_key`, `status` (pending/paid), `paid_at`, `created_at`, `notes`

**`affiliate_clicks`** — Rastreamento de cliques no link
- `id`, `affiliate_id`, `ip_hash`, `user_agent`, `created_at`

RLS: Afiliados veem apenas seus próprios dados. Admins veem tudo.

### 2. Fluxo do Checkout (modificação)

- Ao acessar o site via `?ref=CODE`, salvar o código em `localStorage`
- No checkout, ao aplicar cupom, verificar se é cupom de afiliado (buscar em `affiliates.coupon_code`)
- Se for cupom de afiliado OU se há `ref` no localStorage, registrar a venda em `affiliate_sales` via trigger/função no banco
- O cupom de afiliado dá desconto ao cliente (configurável) E gera comissão ao afiliado

### 3. Páginas Novas

**`/parceiros`** — Landing page pública
- Explicação do programa, benefícios, formulário de cadastro
- Campos: nome, email, Instagram, tipo de canal, por que quer ser parceiro
- Após envio: "Candidatura enviada! Entraremos em contato."

**`/parceiros/painel`** — Dashboard do afiliado (autenticado)
- KPIs: total ganho, vendas este mês, comissão pendente, cliques no link
- Tabela de vendas com status (pendente/confirmado/pago)
- Copiar link e cupom com um clique
- Solicitar saque (cria entrada em `affiliate_payouts`)
- Histórico de pagamentos

### 4. Painel Admin (`/admin/afiliados`)

- Lista de afiliados com filtro por status
- Aprovar/suspender afiliados
- Ver vendas e comissões de cada afiliado
- Ajustar % de comissão individual
- Gerenciar saques (marcar como pago)
- KPIs globais: total de afiliados ativos, receita gerada, comissões pagas

### 5. Integração no Admin Layout

- Adicionar item "Afiliados" no menu lateral (ícone `Handshake`)
- Rota `/admin/afiliados` protegida por `AdminRoute`

---

### Detalhes Técnicos

- **Tabelas**: 4 migrações SQL com RLS policies
- **Trigger**: Função `register_affiliate_sale()` que ao inserir um pedido verifica se o cupom usado pertence a um afiliado e cria o registro em `affiliate_sales`
- **Ref tracking**: Componente wrapper que lê `?ref=` da URL e persiste no localStorage
- **Arquivos novos**: ~6 (página parceiros, painel afiliado, admin afiliados, componentes auxiliares)
- **Arquivos modificados**: AnimatedRoutes (rotas), AdminLayout (menu), Checkout (integração cupom afiliado)
- **Sem dependências externas** novas necessárias

