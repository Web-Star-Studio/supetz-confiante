import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Menu, X, ChevronRight, Gift,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import AdminGlobalSearch from "./AdminGlobalSearch";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Pedidos", path: "/admin/pedidos", icon: ShoppingCart },
  { label: "Produtos", path: "/admin/produtos", icon: Package },
  { label: "Clientes", path: "/admin/clientes", icon: Users },
  { label: "Fidelização", path: "/admin/fidelizacao", icon: Gift },
  { label: "Configurações", path: "/admin/configuracoes", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-supet-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-supet-text/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-supet-bg-alt z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo with orange gradient top */}
        <div className="relative p-6 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <Link to="/admin" className="flex items-center gap-3 relative z-10">
            <img src="/supetNewLogo.svg" alt="Supet" className="h-8" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-primary/15 text-primary px-2.5 py-1 rounded-full">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20" />
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm relative">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-supet-bg/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <img src="/supetNewLogo.svg" alt="Supet" className="h-7 lg:hidden" />
          <div className="hidden lg:block">
            <AdminGlobalSearch />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="lg:hidden">
              <AdminGlobalSearch />
            </div>
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
