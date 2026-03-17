import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Shop from "./pages/Shop";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Quiz from "./pages/Quiz";
import Ciencia from "./pages/Ciencia";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <SmoothScrollProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/ciencia" element={<Ciencia />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SmoothScrollProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
