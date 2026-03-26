

## Rastreamento Robusto de Indicação de Afiliados

### Problema Atual
O `supet_ref` já é salvo no `localStorage` pelo `RefTracker` e persiste entre navegações. Porém:
1. O cupom do afiliado **nunca é aplicado automaticamente** no checkout — o ref só é passado como metadado no pedido
2. Se o usuário não estiver logado, não há como aplicar cupom automaticamente
3. Não há feedback visual de que o usuário chegou por indicação
4. O timestamp da indicação não é salvo, então refs antigos ficam para sempre

### Solução

#### 1. Salvar ref com timestamp no RefTracker
Alterar `RefTracker.tsx` para salvar um objeto `{ slug, timestamp }` no localStorage em vez de apenas a string. Definir expiração de 30 dias — refs mais antigos são ignorados.

#### 2. Auto-aplicar cupom do afiliado no Checkout
No `Checkout.tsx`, ao carregar a página:
- Verificar se existe `supet_ref` no localStorage (e se não expirou)
- Buscar o afiliado pelo `ref_slug` e pegar o `coupon_code`
- Se o afiliado tiver cupom, pré-preencher o campo de cupom e exibir um banner "Você chegou por indicação de [nome]! Cupom aplicado automaticamente"
- O cupom do afiliado funciona como cupom global (não precisa estar na tabela `user_coupons` do usuário) — buscar desconto diretamente da tabela `affiliates`

#### 3. Banner de indicação no CartDrawer
No `CartDrawer.tsx`, exibir um pequeno badge "Indicação ativa" quando `supet_ref` existir no localStorage, reforçando que o desconto será aplicado.

#### 4. Persistir ref no perfil do usuário após login/cadastro
No `AuthContext.tsx`, após login/cadastro bem-sucedido, verificar se existe `supet_ref` no localStorage. Se sim, manter no localStorage (já acontece naturalmente). Isso garante que mesmo após criar conta, o ref continua ativo.

### Arquivos Modificados
- `src/components/affiliate/RefTracker.tsx` — salvar ref com timestamp, expiração 30 dias
- `src/pages/Checkout.tsx` — auto-aplicar cupom do afiliado, banner de indicação, buscar desconto da tabela affiliates
- `src/components/layout/CartDrawer.tsx` — badge visual de indicação ativa
- Nenhuma migration necessária (o `coupon_code` já existe na tabela `affiliates`)

### Detalhes Técnicos

**RefTracker** salvará:
```typescript
localStorage.setItem("supet_ref", JSON.stringify({ slug: ref, ts: Date.now() }));
```

**Checkout** fará na montagem:
```typescript
// Ler ref do localStorage
const refData = JSON.parse(localStorage.getItem("supet_ref"));
if (refData && Date.now() - refData.ts < 30 * 24 * 60 * 60 * 1000) {
  // Buscar afiliado e aplicar cupom
  const { data: aff } = await supabase
    .from("affiliates")
    .select("name, coupon_code, commission_percent")
    .eq("ref_slug", refData.slug)
    .eq("status", "active")
    .maybeSingle();
  // Auto-aplicar desconto como "cupom de afiliado" separado do sistema de cupons do user
}
```

O desconto do afiliado será tratado como uma **categoria separada** dos cupons do usuário, permitindo acumular (cupom pessoal + desconto de indicação) ou não, conforme preferência. Na implementação inicial, o cupom do afiliado substituirá o campo de cupom manual se existir.

