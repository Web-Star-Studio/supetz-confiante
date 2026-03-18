import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import AnimatedRoutes from "@/components/layout/AnimatedRoutes";
import CartDrawer from "@/components/layout/CartDrawer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <SmoothScrollProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CartDrawer />
          <AnimatedRoutes />
        </BrowserRouter>
      </SmoothScrollProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
