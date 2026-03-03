

# Supetz — E-commerce DTC Premium

## 1. Configuração Base
- Estender Tailwind com cores customizadas (`supetz-orange`, `supetz-orange-dark`, `supetz-bg`, `supetz-bg-alt`)
- Importar fonte Nunito (Google Fonts) no `index.html`
- Instalar Framer Motion para animações
- Instalar e configurar `vite-plugin-pwa` com manifesto (nome "Supetz", theme_color `#ff7603`, background_color `#f6f1ec`), service worker GenerateSW, e meta tags PWA no `index.html` (incluindo iOS)
- Criar ícones placeholder PWA em `public/`

## 2. Arquitetura de Dados e Estado
- `src/types/` — interfaces TypeScript (Product, CartItem, FAQ, Benefit, etc.) estruturadas para futura integração Shopify
- `src/services/mockData.ts` — dados mock dos 3 combos de preços, benefícios e FAQs
- `src/context/CartContext.tsx` — gerenciamento de carrinho via React Context

## 3. Layout Global (componentes custom, zero shadcn/ui)
- **Header**: Sticky, `bg-supetz-bg/80` com backdrop-blur, nav minimalista ("Início", "Benefícios", "Sobre Nós", "FAQ"), ícone de carrinho com badge laranja
- **Footer**: Layout limpo com tema off-white quente
- Todos os botões pill-shaped (`rounded-full`), cards `rounded-3xl`, animações Framer Motion no hover

## 4. Landing Page (/)
- **Hero**: Layout split — headline à esquerda ("Seu pet livre de coceiras e feridas em 30 dias") + CTA laranja. À direita: círculo laranja gigante atrás de placeholder de imagem de cachorro + placeholder Remotion
- **Benefícios**: Grid com 4 itens ("Alívio em 7 dias", "100% Natural", "Pelagem Linda", "Fortalece a Imunidade")
- **Preços**: 3 cards combo ("O Queridinho", "O Mais Vendido" com badge destaque, "O Recomendado") em `bg-supetz-bg-alt` com `rounded-3xl`
- **FAQ**: Accordion borderless e clean
- Pontos laranjas flutuantes como acentos lúdicos

## 5. Página Sobre Nós (/sobre)
- Hero tipográfico: "Nossa Missão: Saúde de Dentro para Fora"
- Seções sobre ingredientes naturais e ciência veterinária com motivo de círculos laranjas

## 6. Placeholder Remotion
- Diretório `src/components/remotion-assets/` com placeholder estilizado e visível

## Todos os textos em pt-BR. Fundo off-white quente em toda a aplicação, sem preto absoluto.

