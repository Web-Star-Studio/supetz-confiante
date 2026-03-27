import { useMemo } from "react";
import { FileSpreadsheet, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

interface Props {
  orders: Order[];
  expenses: Expense[];
}

const categoryLabels: Record<string, string> = {
  product: "Custo de Produto",
  shipping: "Frete",
  marketing: "Marketing",
  platform: "Plataforma",
  salary: "Salários",
  tax: "Impostos",
  other: "Outros",
};

export default function DRETab({ orders, expenses }: Props) {
  const dreData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    const activeOrders = orders.filter((o) => o.status !== "cancelled");

    return months.map(({ key, label }) => {
      const monthOrders = activeOrders.filter((o) => o.created_at.startsWith(key));
      const monthExpenses = expenses.filter((e) => e.date.startsWith(key));

      const revenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);

      const costByCategory: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        costByCategory[e.category] = (costByCategory[e.category] || 0) + Number(e.amount);
      });

      const cogs = (costByCategory["product"] || 0) + (costByCategory["shipping"] || 0);
      const grossProfit = revenue - cogs;
      const opex = Object.entries(costByCategory)
        .filter(([k]) => k !== "product" && k !== "shipping" && k !== "tax")
        .reduce((s, [, v]) => s + v, 0);
      const ebitda = grossProfit - opex;
      const taxes = costByCategory["tax"] || 0;
      const netProfit = ebitda - taxes;

      return {
        key,
        label,
        revenue,
        cogs,
        grossProfit,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        opex,
        ebitda,
        taxes,
        netProfit,
        netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        costByCategory,
      };
    });
  }, [orders, expenses]);

  const totals = useMemo(() => {
    const t = dreData.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        cogs: acc.cogs + m.cogs,
        grossProfit: acc.grossProfit + m.grossProfit,
        opex: acc.opex + m.opex,
        ebitda: acc.ebitda + m.ebitda,
        taxes: acc.taxes + m.taxes,
        netProfit: acc.netProfit + m.netProfit,
      }),
      { revenue: 0, cogs: 0, grossProfit: 0, opex: 0, ebitda: 0, taxes: 0, netProfit: 0 }
    );
    return {
      ...t,
      grossMargin: t.revenue > 0 ? (t.grossProfit / t.revenue) * 100 : 0,
      netMargin: t.revenue > 0 ? (t.netProfit / t.revenue) * 100 : 0,
    };
  }, [dreData]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const rows: { label: string; key: keyof typeof totals; bold?: boolean; color?: string; indent?: boolean; isMargin?: boolean }[] = [
    { label: "Receita Bruta", key: "revenue", bold: true },
    { label: "(-) Custo dos Produtos Vendidos", key: "cogs", color: "text-destructive", indent: true },
    { label: "= Lucro Bruto", key: "grossProfit", bold: true, color: "text-emerald-600" },
    { label: "Margem Bruta", key: "grossMargin", isMargin: true },
    { label: "(-) Despesas Operacionais", key: "opex", color: "text-destructive", indent: true },
    { label: "= EBITDA", key: "ebitda", bold: true },
    { label: "(-) Impostos", key: "taxes", color: "text-destructive", indent: true },
    { label: "= Lucro Líquido", key: "netProfit", bold: true },
    { label: "Margem Líquida", key: "netMargin", isMargin: true },
  ];

  return (
    <div className="bg-card rounded-3xl p-5 overflow-x-auto">
      <div className="flex items-center gap-2 mb-1">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">DRE — Demonstrativo de Resultados</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">Últimos 6 meses, gerado automaticamente com base em receitas e despesas cadastradas.</p>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 px-2 font-semibold text-muted-foreground min-w-[160px]">Conta</th>
            {dreData.map((m) => (
              <th key={m.key} className="text-right py-2 px-2 font-semibold text-muted-foreground min-w-[90px]">{m.label}</th>
            ))}
            <th className="text-right py-2 px-2 font-bold text-foreground min-w-[100px] bg-muted/30">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={`border-b border-border/20 ${row.bold ? "bg-muted/10" : ""}`}>
              <td className={`py-2 px-2 ${row.bold ? "font-bold text-foreground" : "text-muted-foreground"} ${row.indent ? "pl-6" : ""}`}>
                {row.label}
              </td>
              {dreData.map((m) => {
                const val = m[row.key as keyof typeof m] as number;
                const color = row.isMargin
                  ? val >= 15 ? "text-emerald-600" : val >= 0 ? "text-amber-500" : "text-destructive"
                  : row.color || (row.bold && row.key !== "revenue" ? (val >= 0 ? "text-emerald-600" : "text-destructive") : "text-foreground");
                return (
                  <td key={m.key} className={`py-2 px-2 text-right ${row.bold ? "font-bold" : "font-medium"} ${color}`}>
                    {row.isMargin ? `${val.toFixed(1)}%` : fmt(val)}
                  </td>
                );
              })}
              <td className={`py-2 px-2 text-right font-bold bg-muted/30 ${
                row.isMargin
                  ? (totals[row.key] as number) >= 15 ? "text-emerald-600" : (totals[row.key] as number) >= 0 ? "text-amber-500" : "text-destructive"
                  : row.color || (row.bold && row.key !== "revenue" ? ((totals[row.key] as number) >= 0 ? "text-emerald-600" : "text-destructive") : "text-foreground")
              }`}>
                {row.isMargin ? `${(totals[row.key] as number).toFixed(1)}%` : fmt(totals[row.key] as number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Quick insights */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Margem Bruta Média",
            value: `${totals.grossMargin.toFixed(1)}%`,
            icon: totals.grossMargin >= 30 ? TrendingUp : totals.grossMargin >= 0 ? Minus : TrendingDown,
            color: totals.grossMargin >= 30 ? "text-emerald-600" : totals.grossMargin >= 0 ? "text-amber-500" : "text-destructive",
          },
          {
            label: "EBITDA Acumulado",
            value: fmt(totals.ebitda),
            icon: totals.ebitda >= 0 ? TrendingUp : TrendingDown,
            color: totals.ebitda >= 0 ? "text-emerald-600" : "text-destructive",
          },
          {
            label: "Margem Líquida",
            value: `${totals.netMargin.toFixed(1)}%`,
            icon: totals.netMargin >= 10 ? TrendingUp : totals.netMargin >= 0 ? Minus : TrendingDown,
            color: totals.netMargin >= 10 ? "text-emerald-600" : totals.netMargin >= 0 ? "text-amber-500" : "text-destructive",
          },
        ].map((item) => (
          <div key={item.label} className="bg-muted/30 rounded-2xl p-3 text-center">
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
            <p className={`text-lg font-extrabold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
