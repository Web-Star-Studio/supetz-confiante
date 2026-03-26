

## Vincular Afiliados a Contas de Clientes

### Problema Atual
Quando o admin cria um afiliado manualmente, usa um `user_id` placeholder (`00000000-...`). Isso impede que o afiliado acesse o painel de parceiro mesmo tendo conta. Não há vinculação automática nem botão para alternar entre painéis.

### Solução em 3 Partes

#### 1. Vincular na criação pelo admin
No `handleAddAffiliate` em `Afiliados.tsx`, antes de inserir, buscar na tabela `profiles` um usuário com email correspondente (via join ou busca direta). Se encontrar, usar o `user_id` real em vez do placeholder.

#### 2. Vincular automaticamente no cadastro
Criar uma trigger no banco (ou adicionar lógica à função `handle_new_user`) que, ao criar um novo usuário, verifica se existe um registro em `affiliates` com o mesmo email e `user_id` placeholder, e atualiza o `user_id` para o do novo usuário.

**Migration SQL:**
- Alterar `handle_new_user()` para incluir: `UPDATE affiliates SET user_id = NEW.id WHERE email = (NEW.raw_user_meta_data->>'email' OR NEW.email) AND user_id = '00000000-...'`

#### 3. Botão de alternar painel
- **Na página Perfil** (`Perfil.tsx`): Verificar se o usuário tem registro ativo em `affiliates`. Se sim, mostrar um botão "Painel de Parceiro" que leva a `/parceiros/painel`.
- **No Dashboard do Afiliado** (`affiliate/Dashboard.tsx`): Adicionar botão "Minha Conta" que leva a `/perfil`.

### Arquivos Modificados
- `src/pages/admin/Afiliados.tsx` — buscar user_id real por email ao adicionar
- `src/pages/Perfil.tsx` — botão condicional para painel de parceiro
- `src/pages/affiliate/Dashboard.tsx` — botão para voltar ao perfil
- **Migration SQL** — atualizar `handle_new_user()` para vincular afiliados automaticamente

### Detalhes Técnicos
- A busca por email no admin usará: query profiles + join com auth (ou busca direta pelo email no profiles, considerando que profiles não tem email — precisará buscar via `supabase.auth.admin` ou pela tabela affiliates mesmo, comparando emails)
- Na verdade, como profiles não armazena email, a abordagem no admin será: buscar todos profiles e cruzar, ou usar uma edge function. Alternativa mais simples: usar `supabase.rpc` ou buscar via `auth.users` não é possível pelo client. **Solução pragmática**: criar uma DB function `link_affiliate_by_email(email text)` que faz o lookup em `auth.users` (security definer) e retorna o user_id, para usar no admin.

