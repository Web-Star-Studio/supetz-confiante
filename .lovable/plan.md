

## Plano: Dashboard de Resumo no Perfil do Usuario

### O que sera criado

Um novo componente `ProfileDashboardTab.tsx` que sera a aba inicial do perfil, mostrando um resumo visual completo de todos os recursos do usuario em cards organizados.

### Conteudo do Dashboard

**Cards de metricas rapidas (grid 2x2 no mobile, 4 colunas no desktop):**
- Total de pedidos + ultimo status
- Saldo de pontos de fidelidade
- Cupons ativos disponiveis
- Lembretes de reposicao pendentes

**Secao "Meu Pet" (resumo):**
- Nome, raca, peso e foto do pet (se cadastrado)
- Link rapido para editar

**Secao "Ultimo Pedido":**
- Status atual com timeline simplificada
- Valor e data

**Secao "Proxima Reposicao":**
- Produto e data estimada do proximo lembrete

**Secao "Diario de Tratamento":**
- Ultimo registro com data e notas

**Secao "Notificacoes recentes":**
- 3 ultimas notificacoes nao lidas

**Acoes rapidas (grid de botoes):**
- Ir para loja, Falar com Super IA, Ver conquistas, etc.

### Alteracoes nos arquivos

1. **Criar `src/components/profile/ProfileDashboardTab.tsx`**
   - Componente que busca dados resumidos de todas as tabelas (orders, pets, loyalty_points, user_coupons, restock_reminders, treatment_logs, user_notifications)
   - Queries paralelas com Promise.all
   - Cards com icones e cores consistentes com o design system
   - Botoes de acao rapida que chamam `setActiveTab` via prop

2. **Editar `src/pages/Perfil.tsx`**
   - Adicionar "dashboard" como primeiro item no `navItems` com icone `LayoutDashboard`
   - Definir `activeTab` inicial como `"dashboard"`
   - Importar e renderizar `ProfileDashboardTab` no switch
   - Passar `setActiveTab` como prop para navegacao interna

### Detalhes tecnicos

- Todas as queries usam o Supabase client existente com RLS (sem alteracoes no banco)
- Layout responsivo: grid de 1 coluna no mobile, 2-4 colunas no desktop
- Skeleton loading durante carregamento
- Animacoes com framer-motion consistentes com o resto do perfil

