import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Index from "../../pages/Index";
import Sobre from "../../pages/Sobre";
import Shop from "../../pages/Shop";
import Blog from "../../pages/Blog";
import BlogPost from "../../pages/BlogPost";
import NotFound from "../../pages/NotFound";
import Ciencia from "../../pages/Ciencia";
import FAQ from "../../pages/FAQ";
import Checkout from "../../pages/Checkout";
import Success from "../../pages/Success";
import Login from "../../pages/Login";
import Cadastro from "../../pages/Cadastro";
import RecuperarSenha from "../../pages/RecuperarSenha";
import ResetPassword from "../../pages/ResetPassword";
import Perfil from "../../pages/Perfil";

import AdminRoute from "../../components/admin/AdminRoute";
import AdminDashboard from "../../pages/admin/Dashboard";
import AdminPedidos from "../../pages/admin/Pedidos";
import AdminProdutos from "../../pages/admin/Produtos";
import AdminConfiguracoes from "../../pages/admin/Configuracoes";
import AdminFidelizacao from "../../pages/admin/Fidelizacao";
import AdminCRM from "../../pages/admin/CRM";
import AdminMarketing from "../../pages/admin/Marketing";
import AdminEstoque from "../../pages/admin/Estoque";
import AdminFinanceiro from "../../pages/admin/Financeiro";
import AdminAuditoria from "../../pages/admin/Auditoria";
import AdminBaseConhecimento from "../../pages/admin/BaseConhecimento";
import AdminGerenciarIA from "../../pages/admin/GerenciarIA";

import PageTransition from "./PageTransition";

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/success" element={<PageTransition><Success /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
        <Route path="/sobre" element={<PageTransition><Sobre /></PageTransition>} />
        <Route path="/ciencia" element={<PageTransition><Ciencia /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />

        {/* Profile */}
        <Route path="/perfil" element={<PageTransition><Perfil /></PageTransition>} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/pedidos" element={<AdminRoute><AdminPedidos /></AdminRoute>} />
        <Route path="/admin/produtos" element={<AdminRoute><AdminProdutos /></AdminRoute>} />
        <Route path="/admin/configuracoes" element={<AdminRoute><AdminConfiguracoes /></AdminRoute>} />
        <Route path="/admin/fidelizacao" element={<AdminRoute><AdminFidelizacao /></AdminRoute>} />
        <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
        <Route path="/admin/marketing" element={<AdminRoute><AdminMarketing /></AdminRoute>} />
        <Route path="/admin/estoque" element={<AdminRoute><AdminEstoque /></AdminRoute>} />
        <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
        <Route path="/admin/auditoria" element={<AdminRoute><AdminAuditoria /></AdminRoute>} />
        <Route path="/admin/ia" element={<AdminRoute><AdminGerenciarIA /></AdminRoute>} />
        <Route path="/admin/base-conhecimento" element={<AdminRoute><AdminBaseConhecimento /></AdminRoute>} />
        <Route path="/admin/clientes" element={<Navigate to="/admin/crm" replace />} />

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
