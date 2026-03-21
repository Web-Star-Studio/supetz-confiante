import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import AnimatedRoutes from "@/components/layout/AnimatedRoutes";
import CartDrawer from "@/components/layout/CartDrawer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SmoothScrollProvider>
            <ScrollToTop />
            <CartDrawer />
            <AnimatedRoutes />
          </SmoothScrollProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
