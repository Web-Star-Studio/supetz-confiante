

## Plano: Supet PWA Nativo — Responsividade 100% Mobile-First

### Contexto atual

O app ja tem uma base PWA (vite-plugin-pwa, manifest, bottom nav, install prompt, service worker). Porem, varios elementos ainda nao estao otimizados para uma experiencia nativa mobile. A screenshot mostra que o perfil funciona mas ha espacos desperdicados e elementos que nao se comportam como um app nativo.

### O que sera feito

1. **Header mobile compacto e nativo** — No mobile, reduzir o header para uma barra minima (logo + notificacao) ja que a navegacao principal esta no bottom nav. Esconder links de nav duplicados.

2. **Footer oculto no mobile** — Apps nativos nao tem footer. Esconder o footer no mobile e mover links importantes (FAQ, Sobre, etc.) para o menu mobile ou bottom nav.

3. **Chatbot reposicionado** — Mover o botao flutuante do chatbot para acima do bottom nav no mobile (bottom-20 → bottom-24) para nao sobrepor.

4. **StickyCartBar ajustado** — Garantir que a barra sticky de compra nao sobreponha o bottom nav.

5. **Perfil mobile otimizado** — Reduzir padding superior, compactar avatar section, melhorar scroll horizontal dos tabs para parecer nativo.

6. **Touch interactions** — Adicionar `touch-action: manipulation` global para eliminar delay de 300ms em taps. Adicionar `-webkit-tap-highlight-color: transparent`.

7. **Splash screen / status bar** — Adicionar meta tags para splash screen no iOS e configurar status bar translucida.

8. **Transicoes nativas** — Garantir que as transicoes de pagina sejam suaves e nao tenham jank.

9. **Service Worker reativado** — O `main.tsx` atual desregistra todos os service workers. Remover essa logica para permitir funcionamento offline e cache do PWA.

10. **Push notifications base** — Preparar a infraestrutura para notificacoes push (registrar subscription no banco, edge function para envio).

### Arquivos alterados

**`src/index.css`**
- Adicionar `touch-action: manipulation` e `-webkit-tap-highlight-color: transparent` no body
- Ajustar padding-bottom mobile para acomodar bottom nav + sticky cart
- Adicionar `scroll-snap` para tabs horizontais

**`src/main.tsx`**
- Remover o bloco que desregistra service workers (necessario para PWA funcionar)

**`src/components/layout/Header.tsx`**
- No mobile: renderizar apenas logo + icone perfil + carrinho (sem hamburger menu, sem nav links duplicados — bottom nav ja cuida disso)

**`src/components/layout/Footer.tsx`**
- Adicionar `hidden md:block` ou classe similar para esconder no mobile (bottom nav substitui)

**`src/components/chat/FloatingChatbot.tsx`**
- Ajustar posicao do botao flutuante para `bottom-24 md:bottom-6` no mobile

**`src/components/layout/StickyCartBar.tsx`**
- Ajustar bottom position para ficar acima do bottom nav

**`src/pages/Perfil.tsx`**
- Compactar header mobile (avatar menor, menos padding)
- Melhorar tabs com scroll-snap

**`index.html`**
- Adicionar meta tags para iOS splash screen
- Adicionar `apple-mobile-web-app-status-bar-style` como `black-translucent`

**`supabase/migrations/` — nova tabela `push_subscriptions`**
- Tabela para armazenar subscriptions de push notification por usuario
- Campos: user_id, endpoint, p256dh, auth, created_at

**`src/components/pwa/PushNotificationManager.tsx`** (novo)
- Componente que solicita permissao de notificacao
- Registra subscription via Push API e salva no banco

### Detalhes tecnicos

- Nenhuma mudanca de framework — tudo CSS/React
- Push notifications usam Web Push API (VAPID) — requer gerar chaves VAPID e armazenar como secrets
- O service worker do vite-plugin-pwa ja suporta push events via customizacao do workbox
- Todas as alteracoes sao backward-compatible com desktop

