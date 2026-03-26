

## Auditoria Completa do Painel Admin — Problemas Encontrados

### Resumo
Após análise detalhada de todos os arquivos do painel administrativo, identifiquei **7 problemas** entre bugs funcionais, inconsistências de UI e melhorias de robustez.

---

### Problemas Encontrados

**1. Dashboard: Pedidos sem paginação (limite de 1000 rows)**
- `Dashboard.tsx` e `Pedidos.tsx` buscam todos os pedidos sem paginação
- O Supabase tem limite padrão de 1000 rows por query
- Se houver mais de 1000 pedidos, os KPIs de receita e contagem ficarão incorretos
- **Correção**: Usar queries com `.count("exact")` para totais e limitar os dados do gráfico com filtro de data

**2. Pedidos/Produtos/Estoque: uso de classes `bg-supet-bg-alt` e `bg-supet-bg` (hardcoded theme colors)**
- Essas classes funcionam, mas criam inconsistência visual com as páginas que usam `bg-card` e `bg-muted` (como Dashboard, Auditoria, GerenciarIA)
- Não é um bug, mas cria disparidade visual entre módulos
- **Correção**: Padronizar todas as páginas admin para usar tokens semânticos (`bg-card`, `bg-muted`) em vez de cores hardcoded do tema

**3. Marketing: envio de campanha sem feedback de erro quando `userIds` é vazio**
- Em `Marketing.tsx` linha ~156, se nenhum usuário corresponde ao segmento, a função retorna silenciosamente sem feedback ao admin
- **Correção**: Adicionar `toast.warning("Nenhum cliente encontrado para este segmento")` antes de retornar

**4. Fidelização: formulários de pontos e cupons pedem `userId` como texto livre**
- O admin precisa digitar o UUID do usuário manualmente, o que é propenso a erros
- **Correção**: Substituir por um select/combobox que lista os perfis existentes com nome e email

**5. CRM: fetch de dados pode ser lento com muitas tabelas paralelas**
- `CRM.tsx` faz 6 queries paralelas sem tratamento de erro
- Se uma falhar silenciosamente, os dados ficam parciais sem feedback
- **Correção**: Adicionar tratamento de erro e toast em caso de falha

**6. Auditoria: cast `as unknown as AuditLog[]` indica tipagem fraca**
- O uso de `as any` e `as unknown` em vários pontos da Auditoria pode esconder erros em runtime
- Não é um bug funcional, mas reduz a segurança de tipos
- **Correção**: Usar os tipos gerados do Supabase corretamente

**7. NotificationCenter: tipo de filtro limitado**
- O `TypeFilter` só suporta `"order" | "restock"` mas a tabela `admin_notifications` pode ter tipo `"stock"` (gerado pelo trigger de estoque baixo)
- Notificações de estoque ficam ocultas no filtro por tipo
- **Correção**: Adicionar `"stock"` ao filtro de tipo

---

### Plano de Implementação

1. **Marketing.tsx** — Adicionar toast de aviso quando nenhum cliente é encontrado no segmento (3 pontos de retorno silencioso)
2. **NotificationCenter.tsx** — Adicionar `"stock"` ao TypeFilter e seu label
3. **Fidelização.tsx** — Substituir campos de userId por select com lista de perfis
4. **Padronizar UI** — Substituir `bg-supet-bg-alt`/`bg-supet-bg` por `bg-card`/`bg-muted` nas páginas Pedidos, Produtos, Estoque, Financeiro, Fidelização e Marketing
5. **Dashboard.tsx** — Usar contagem com `.count("exact")` para métricas que podem exceder 1000 rows
6. **CRM.tsx** — Adicionar catch/toast para falhas de fetch
7. **Auditoria.tsx** — Melhorar tipagem removendo casts desnecessários

### Detalhes Técnicos
- Arquivos afetados: ~10 arquivos no painel admin
- Nenhuma alteração de banco de dados necessária
- Todas as correções são client-side
- Prioridade: itens 1-3 são bugs funcionais, itens 4-7 são melhorias de qualidade

