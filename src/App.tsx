import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import AnimatedRoutes from "@/components/layout/AnimatedRoutes";
import CartDrawer from "@/components/layout/CartDrawer";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import MobileBottomNav from "@/components/pwa/MobileBottomNav";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <SmoothScrollProvider>
              <ScrollToTop />
              <CartDrawer />
              <FloatingChatbot />
              <PWAInstallPrompt />
              <MobileBottomNav />
              <AnimatedRoutes />
            </SmoothScrollProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
