

# Página de Perfil do Usuário

## Escopo
Criar uma página `/perfil` completa onde o usuário autenticado pode editar seus dados pessoais, gerenciar avatar e visualizar histórico de compras.

## 1. Nova Página — `src/pages/Perfil.tsx`

Página com layout dividido em seções usando tabs:

**Aba "Meus Dados":**
- Formulário para editar: nome completo, telefone
- Upload de avatar (usando bucket `product-images` ou novo bucket `avatars`)
- Preview circular do avatar atual
- Botão salvar com feedback visual

**Aba "Minhas Compras":**
- Lista de pedidos do usuário (`orders` table, filtrado por `user_id`)
- Cards com: data, status (badge colorido), total, itens resumidos
- Ordenação por data decrescente
- Estado vazio com ilustração quando sem compras

**Aba "Segurança":**
- Alterar senha (reutilizando lógica existente do `Configuracoes.tsx`)
- Exibir e-mail da conta (read-only)

## 2. Header — Ícone de Usuário

Adicionar ao `Header.tsx`:
- Ícone de usuário (`User` ou `UserCircle`) ao lado do carrinho
- Se logado: link para `/perfil` com avatar miniatura
- Se não logado: link para `/login`

## 3. Rota — `AnimatedRoutes.tsx`

- Adicionar rota `/perfil` protegida (redireciona para `/login` se não autenticado)

## 4. Storage — Bucket de Avatars

- Criar bucket `avatars` (público) via migração SQL
- RLS: usuários podem fazer upload apenas no próprio path (`user_id/filename`)
- Leitura pública para exibir avatars

## 5. Estética

- Mesma linguagem visual "Playful Trust": `bg-supet-bg`, `bg-supet-bg-alt`, `rounded-3xl`
- Círculos laranjas decorativos no fundo
- Animações Framer Motion nos cards de pedidos e tabs

## Detalhes Técnicos

- **Migração SQL**: Criar bucket `avatars` com políticas de storage
- **Arquivos novos**: `src/pages/Perfil.tsx`
- **Arquivos modificados**: `AnimatedRoutes.tsx`, `Header.tsx`
- **Dados**: Query na tabela `profiles` para load/save, `orders` para histórico
- **Upload**: `supabase.storage.from('avatars').upload(...)` com path `{user_id}/avatar.{ext}`

