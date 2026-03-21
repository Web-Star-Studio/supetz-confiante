import { Routes, Route, useLocation } from "react-router-dom";
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
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
