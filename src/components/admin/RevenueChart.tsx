import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ChartData {
  day: string;
  revenue: number;
  orders: number;
}

export default function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Bar Chart */}
      <div className="bg-supet-bg-alt rounded-3xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-4 font-display">Receita (7 dias)</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12, boxShadow: "0 8px 24px -8px rgba(55,35,10,0.15)" }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
              />
              <Bar dataKey="revenue" fill="hsl(27 100% 49%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Line Chart */}
      <div className="bg-supet-bg-alt rounded-3xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-4 font-display">Pedidos (7 dias)</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(25 10% 45%)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(30 33% 95%)", border: "none", borderRadius: 16, fontSize: 12, boxShadow: "0 8px 24px -8px rgba(55,35,10,0.15)" }}
                formatter={(value: number) => [value, "Pedidos"]}
              />
              <Line type="monotone" dataKey="orders" stroke="hsl(27 100% 49%)" strokeWidth={3} dot={{ fill: "hsl(27 100% 49%)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
