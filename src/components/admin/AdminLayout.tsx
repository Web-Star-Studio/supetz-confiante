import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Menu, X, ChevronRight,
  Gift, Megaphone, Boxes, Wallet, ScrollText, PanelLeftClose, PanelLeft, BookOpen, Brain, FileText, Handshake, MessageSquareHeart,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import AdminGlobalSearch from "./AdminGlobalSearch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Pedidos", path: "/admin/pedidos", icon: ShoppingCart },
  { label: "Produtos", path: "/admin/produtos", icon: Package },
  { label: "Estoque", path: "/admin/estoque", icon: Boxes },
  { label: "Clientes", path: "/admin/crm", icon: Users },
  { label: "Fidelização", path: "/admin/fidelizacao", icon: Gift },
  { label: "Blog", path: "/admin/blog", icon: FileText },
  { label: "Afiliados", path: "/admin/afiliados", icon: Handshake },
  { label: "Marketing", path: "/admin/marketing", icon: Megaphone },
  { label: "Financeiro", path: "/admin/financeiro", icon: Wallet },
  { label: "Auditoria", path: "/admin/auditoria", icon: ScrollText },
  { label: "Feedback IA", path: "/admin/feedback", icon: MessageSquareHeart },
  { label: "Gerenciar IA", path: "/admin/ia", icon: Brain },
  { label: "Base de Conhecimento", path: "/admin/base-conhecimento", icon: BookOpen },
  { label: "Configurações", path: "/admin/configuracoes", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const currentPage = navItems.find(
    (item) => pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path))
  );

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background flex">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} bg-card border-r border-border z-50 flex flex-col transition-all duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Logo */}
          <div className={`flex items-center justify-between border-b border-border/50 ${collapsed ? "h-[72px] px-3" : "h-20 px-6"}`}>
            <Link to="/admin" className="flex items-center">
              <img
                src="/supetNewLogo.svg"
                alt="Supet"
                className={`transition-all duration-300 ${collapsed ? "h-8" : "h-14"}`}
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav data-lenis-prevent className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-2">
                Menu
              </p>
            )}
            {navItems.map((item) => {
              const isActive =
                pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));

              const linkContent = (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center ${collapsed ? "justify-center" : ""} gap-3 ${collapsed ? "px-0 py-3" : "px-3 py-2.5"} rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && isActive && (
                    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    </motion.div>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden lg:flex justify-center py-2 border-t border-border/50">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* User / Logout */}
          <div className={`border-t border-border/50 ${collapsed ? "p-2" : "p-3"}`}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{user?.email}</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded-xl mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[13px] font-semibold text-foreground truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">Administrador</p>
                </div>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className={`flex items-center gap-2 w-full ${collapsed ? "justify-center" : ""} px-3 py-2.5 rounded-xl text-[13px] font-semibold text-destructive hover:bg-destructive/10 transition-colors`}
                >
                  <LogOut className="w-4 h-4" />
                  {!collapsed && "Sair"}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-8 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
              {currentPage && currentPage.path !== "/admin" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="font-semibold text-foreground">{currentPage.label}</span>
                </>
              )}
            </div>

            <img src="/supetNewLogo.svg" alt="Supet" className="h-7 lg:hidden" />

            <div className="flex items-center gap-2 ml-auto">
              <AdminGlobalSearch />
              <NotificationCenter />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
