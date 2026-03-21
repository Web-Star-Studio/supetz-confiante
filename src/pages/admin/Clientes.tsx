import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

export default function AdminClientes() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = profiles.filter(p =>
    !search || (p.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground font-display">Clientes</h1>
        <p className="text-muted-foreground mt-1">Usuários cadastrados na plataforma</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Nome</th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Telefone</th>
                  <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{p.full_name || "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.phone || "—"}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
