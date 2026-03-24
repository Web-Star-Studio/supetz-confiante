import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, ShoppingCart, Package, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  type: "order" | "client" | "product";
  id: string;
  title: string;
  subtitle: string;
  icon: typeof ShoppingCart;
  path: string;
}

const typeLabels = { order: "Pedido", client: "Cliente", product: "Produto" };
const typeColors = { order: "bg-amber-100 text-amber-700", client: "bg-violet-100 text-violet-700", product: "bg-sky-100 text-sky-700" };

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);

    const [ordersRes, profilesRes, productsRes] = await Promise.all([
      supabase.from("orders").select("id, customer_name, total, status, created_at")
        .or(`customer_name.ilike.%${q}%,id.ilike.%${q}%`)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("id, user_id, full_name, phone")
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("id, title, price, active")
        .or(`title.ilike.%${q}%`)
        .order("created_at", { ascending: false }).limit(5),
    ]);

    const items: SearchResult[] = [];

    (ordersRes.data || []).forEach((o) => {
      items.push({
        type: "order",
        id: o.id,
        title: o.customer_name || `Pedido #${o.id.slice(0, 8)}`,
        subtitle: `R$ ${Number(o.total).toFixed(2)} · ${new Date(o.created_at).toLocaleDateString("pt-BR")}`,
        icon: ShoppingCart,
        path: "/admin/pedidos",
      });
    });

    (profilesRes.data || []).forEach((p) => {
      items.push({
        type: "client",
        id: p.id,
        title: p.full_name || "Sem nome",
        subtitle: p.phone || "Sem telefone",
        icon: Users,
        path: "/admin/crm",
      });
    });

    (productsRes.data || []).forEach((p) => {
      items.push({
        type: "product",
        id: p.id,
        title: p.title,
        subtitle: `R$ ${Number(p.price).toFixed(2)} · ${p.active ? "Ativo" : "Inativo"}`,
        icon: Package,
        path: "/admin/produtos",
      });
    });

    setResults(items);
    setLoading(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          placeholder="Buscar pedidos, clientes, produtos... (⌘K)"
          className="w-56 lg:w-72 pl-9 pr-8 py-2 rounded-2xl bg-supet-bg-alt text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (query.length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 w-80 lg:w-96 bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{query}"
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1">
                {results.map((result, i) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-supet-bg-alt flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColors[result.type]}`}>
                        {typeLabels[result.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}