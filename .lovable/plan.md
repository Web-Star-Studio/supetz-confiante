

## Plano: Graficos de Evolucao no Dashboard do Perfil

### O que sera adicionado

Dois graficos no `ProfileDashboardTab.tsx`, entre os cards de metricas e os cards de resumo:

1. **Grafico "Evolucao do Tratamento"** — AreaChart mostrando quantidade de registros no diario por mes (ultimos 6 meses). Usa dados da tabela `treatment_logs` agrupados por mes.

2. **Grafico "Historico de Pontos"** — BarChart mostrando pontos acumulados por mes (ultimos 6 meses). Usa dados da tabela `loyalty_points` agrupados por mes.

### Alteracoes

**Arquivo: `src/components/profile/ProfileDashboardTab.tsx`**

- Importar `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` de `@/components/ui/chart`
- Importar `AreaChart`, `Area`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid` de `recharts`
- Na funcao `loadDashboard`, adicionar 2 queries extras (em paralelo com as existentes):
  - `treatment_logs`: selecionar `log_date` dos ultimos 6 meses, agrupar no frontend por mes
  - `loyalty_points`: selecionar `points, created_at` dos ultimos 6 meses, somar por mes
- Renderizar uma nova secao com grid de 2 colunas contendo os dois graficos entre os metric cards e os cards de resumo
- Cada grafico em um card com estilo consistente (`rounded-2xl bg-supet-bg-alt p-5`)
- Estados vazios: se nao houver dados, mostrar mensagem "Sem dados ainda" com icone

### Detalhes tecnicos

- Recharts ja esta instalado (usado em `chart.tsx` e `RevenueChart.tsx`)
- Agrupamento por mes feito no frontend com `date-fns/format` (ja importado)
- Nenhuma alteracao no banco de dados
- Responsivo: 1 coluna no mobile, 2 no desktop

