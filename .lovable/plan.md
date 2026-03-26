

## Corrigir vinculação de afiliado existente

### Problema
O afiliado `design@webstar.studio` foi adicionado pelo admin **antes** da função `find_user_id_by_email` existir, então ficou com o `user_id` placeholder. O login via Google não dispara a trigger `handle_new_user` porque o usuário já existia. Resultado: o botão "Painel de Parceiro" não aparece no perfil.

### Solução

#### 1. Migration SQL — Corrigir registros existentes e adicionar trigger de login
Criar uma migration que:
- **Atualiza imediatamente** todos os afiliados com placeholder `user_id` que possuem email correspondente em `auth.users`
- **Cria uma trigger no evento de login** (`on_auth_sign_in`) que vincula afiliados automaticamente — cobrindo o caso de usuários que já existem mas ainda não foram vinculados

```sql
-- Fix existing unlinked affiliates
UPDATE public.affiliates a
SET user_id = u.id
FROM auth.users u
WHERE a.email = u.email
  AND a.user_id = '00000000-0000-0000-0000-000000000000';
```

Isso resolverá o caso do `design@webstar.studio` imediatamente e qualquer outro afiliado não vinculado.

#### 2. Nenhuma alteração de código necessária
O código no `Perfil.tsx` já verifica `affiliates` pelo `user_id` do usuário logado. Uma vez que o `user_id` seja atualizado no banco, o botão aparecerá automaticamente.

### Arquivos modificados
- **Nova migration SQL** — atualiza afiliados existentes não vinculados

### Detalhes técnicos
- O `user_id` do afiliado `design@webstar.studio` no banco é `00000000-0000-0000-0000-000000000000`
- O `user_id` real no `auth.users` é `1fcf55e8-d128-4584-ac60-57b162abb938`
- A migration fará o UPDATE cruzando emails entre `affiliates` e `auth.users`

