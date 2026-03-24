import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: Register service worker via vite-plugin-pwa (auto-handled)

createRoot(document.getElementById("root")!).render(<App />);
