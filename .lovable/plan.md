

## Plano: Layout Sidebar para o Perfil do Usuário (Desktop)

### Objetivo
Transformar a página `/perfil` para usar um layout com sidebar fixa no desktop (similar ao admin), mantendo a navegação por tabs horizontal no mobile.

### Arquitetura

```text
Desktop (lg+):
┌──────────┬──────────────────────────┐
│ Sidebar  │  Conteúdo ativo          │
│          │                          │
│ Avatar   │  (Dados / Pet / etc.)    │
│ Nome     │                          │
│ Email    │                          │
│          │                          │
│ ● Dados  │                          │
│ ○ Pet    │                          │
│ ○ Endereç│                          │
│ ○ Compras│                          │
│ ...      │                          │
│          │                          │
│ [Sair]   │                          │
└──────────┴──────────────────────────┘

Mobile:
┌────────────────────────────────┐
│ Avatar + Nome                  │
│ [Dados][Pet][Endereços]... ←→  │
│ ┌────────────────────────────┐ │
│ │ Conteúdo ativo             │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Alterações

**1. Refatorar `src/pages/Perfil.tsx`**
- Substituir `Tabs` do Radix por estado local `activeTab` controlado manualmente
- No desktop (lg+): renderizar sidebar fixa à esquerda com os nav items (avatar, nome, email no topo + lista de seções + botão sair), e conteúdo à direita
- No mobile: manter layout atual com tabs horizontais scrolláveis e avatar centralizado no topo
- A sidebar seguirá o mesmo padrão visual do `AdminLayout`: `w-72`, `bg-supet-bg-alt`, itens com `rounded-2xl`, item ativo com `bg-primary text-primary-foreground shadow-md`, gradiente laranja no topo
- Incluir overlay + botão hamburger no mobile para abrir sidebar opcionalmente (ou manter tabs -- mais natural para o usuário)
- Remover dependência de `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` do Radix; usar renderização condicional baseada em `activeTab`
- Ocultar o Header principal do site (via Layout `hideHeader`) nesta página no desktop, similar ao admin que não usa o Header do site

**2. Não criar novos arquivos de rota** -- a página continua sendo `/perfil` com navegação interna via estado

### Detalhes Técnicos
- Nav items: `{ key, label, icon }` array mapeado tanto para sidebar (desktop) quanto tabs (mobile)
- `useState("dados")` para controlar seção ativa
- CSS: `hidden lg:flex` para sidebar, `lg:hidden` para tabs mobile
- Sidebar sticky com `h-screen` no desktop, overlay no mobile
- Botão "Voltar à loja" (link para `/`) no topo da sidebar
- Botão "Sair" no rodapé da sidebar com `signOut()`

