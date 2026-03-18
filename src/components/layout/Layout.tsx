import { type ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

export default function Layout({ children, hideHeader = false }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col relative pb-20 md:pb-0">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
