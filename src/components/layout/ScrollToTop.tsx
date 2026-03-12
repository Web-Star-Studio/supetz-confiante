import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top on route change
    // Using setTimeout to ensure it happens after React renders the new page
    setTimeout(() => {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
    }, 0);
  }, [pathname]);

  return null;
}
