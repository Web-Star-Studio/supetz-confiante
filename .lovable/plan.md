

# Plano: Unificar Clientes + CRM em um unico modulo

## Objetivo
Eliminar a pagina `/admin/clientes` separada e manter apenas `/admin/crm` como modulo unico de gestao de clientes, combinando as stats da pagina Clientes (total, com compras, gasto medio) com as funcionalidades avancadas do CRM (funil, tags, drawer, notas).

## Alteracoes

### 1. Enriquecer a pagina CRM com stats da pagina Clientes
- Adicionar os 3 cards de metricas (Total clientes, Com compras, Gasto medio) acima dos cards de funil no CRM
- Os dados ja estao disponiveis no state `clients` do CRM

### 2. Remover rota e sidebar de "Clientes"
- **AdminLayout.tsx**: Remover o item `{ label: "Clientes", path: "/admin/clientes", icon: Users }` do array `navItems`
- **AnimatedRoutes.tsx**: Remover import de `AdminClientes` e a rota `/admin/clientes`

### 3. Renomear sidebar
- Mudar o label do CRM de "CRM" para "Clientes" (com icone `Users` ou manter `ContactRound`) para ficar mais intuitivo

### 4. Atualizar Dashboard
- Qualquer link interno que aponte para `/admin/clientes` deve apontar para `/admin/crm`

### 5. Limpar arquivo
- Deletar `src/pages/admin/Clientes.tsx` (codigo morto)

---

## Arquivos afetados
- `src/components/admin/AdminLayout.tsx` — remover item Clientes, renomear CRM
- `src/components/layout/AnimatedRoutes.tsx` — remover rota e import
- `src/pages/admin/CRM.tsx` — adicionar stats cards (Total, Com compras, Gasto medio)
- `src/pages/admin/Dashboard.tsx` — atualizar links para `/admin/crm`
- `src/pages/admin/Clientes.tsx` — deletar

