

# Melhorias no Painel Admin Supetz

## Escopo
Aplicar a estética "Playful Trust" ao admin, adicionar funcionalidades e preparar para testes.

## 1. Design — Aplicar estética Supetz ao Admin

**AdminLayout.tsx**:
- Trocar `bg-background` e `bg-card` por cores Supetz (`bg-supetz-bg`, `bg-supetz-bg-alt`)
- Sidebar com gradiente sutil laranja no topo, nav items com hover laranja
- Avatar com círculo laranja atrás (motif da marca)
- Remover bordas duras (`border-border`) e usar separação por contraste de cor

**StatsCards (Dashboard)**:
- Fundo `bg-supetz-bg-alt`, ícones com círculos laranjas, sem bordas visíveis
- Animação Framer Motion `whileHover={{ scale: 1.03 }}` nos cards

**Tabelas (Pedidos, Clientes)**:
- Remover linhas duras, usar alternância de fundo (`even:bg-supetz-bg-alt/50`)
- Status badges com cores mais quentes e suaves
- Rounded-3xl no container da tabela

**Modal de Produtos**:
- Fundo overlay com tom quente (`bg-[#3d2e1e]/30`)
- Inputs com `bg-supetz-bg` em vez de `bg-background`

**Páginas de Auth (Login, Cadastro)**:
- Adicionar círculos laranjas decorativos no fundo (como na landing)
- Card de login com `bg-supetz-bg-alt`

## 2. Funcionalidades Novas

**Dashboard — Gráficos de Receita**:
- Instalar `recharts`
- Gráfico de barras: receita dos últimos 7 dias
- Gráfico de linha: pedidos por dia
- Cards animados com contagem incremental

**Dashboard — Atividade Recente**:
- Timeline de últimas ações (novo pedido, novo cliente, produto atualizado)
- Badge de "Hoje" / "Ontem" / data

**Pedidos — Detalhes do Pedido**:
- Modal com itens do pedido, endereço de entrega, timeline de status
- Botão de copiar ID do pedido

**Produtos — Upload de Imagem**:
- Criar bucket de storage para imagens de produtos
- Campo de upload no modal de criar/editar produto
- Preview da imagem no card do produto

**Configurações — Dados da Loja**:
- Seção para nome da loja, telefone, endereço
- Tabela `store_settings` no banco (chave-valor)

## 3. Preparação para Teste

- Habilitar auto-confirm de e-mail (para facilitar testes)
- Inserir produtos de seed no banco via migração (3 combos padrão)
- Após login, redirecionar admin para `/admin` automaticamente

## Detalhes Técnicos

- **Banco**: Nova tabela `store_settings` (key TEXT PK, value JSONB) com RLS admin-only. Storage bucket `product-images` com política pública de leitura.
- **Pacote**: Adicionar `recharts` como dependência
- **Arquivos modificados**: `AdminLayout.tsx`, `Dashboard.tsx`, `Pedidos.tsx`, `Produtos.tsx`, `Clientes.tsx`, `Configuracoes.tsx`, `Login.tsx`, `Cadastro.tsx`, `AuthContext.tsx`
- **Arquivos novos**: componente `RevenueChart.tsx`, componente `OrderDetailModal.tsx`

