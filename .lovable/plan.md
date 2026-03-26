

## Exigir Login no Checkout

### Problema
O formulário de checkout é exibido para usuários não logados. Embora o `handleSubmit` já bloqueie o envio, o usuário só descobre que precisa de login ao tentar finalizar — experiência ruim.

### Solução
No `Checkout.tsx`, quando `!user` e `!isLoading`, exibir uma tela de bloqueio elegante **no lugar do formulário**, com:
- Ícone de cadeado e mensagem "Faça login para finalizar sua compra"
- Botões "Entrar" (→ `/login`) e "Criar conta" (→ `/cadastro`)
- O carrinho permanece visível para o usuário não perder os itens
- Após login, o usuário volta ao `/checkout` automaticamente (passar `?redirect=/checkout` na URL de login)

No `Login.tsx`, ler o query param `redirect` e redirecionar para lá após login bem-sucedido (em vez de sempre ir para `/`).

### Arquivos Modificados
- `src/pages/Checkout.tsx` — adicionar gate de login antes do formulário
- `src/pages/Login.tsx` — suportar redirect query param após login
- `src/pages/Cadastro.tsx` — mesma lógica de redirect após cadastro

### Detalhes Técnicos
- O `useAuth()` já fornece `user` e `isLoading`
- A verificação acontece após o check de carrinho vazio (linha 337) e antes do render do formulário (linha 366)
- Os itens do carrinho são mantidos no `CartContext` (localStorage), então sobrevivem ao fluxo de login/cadastro

