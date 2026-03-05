import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any old Service Workers to prevent Lovable preview from caching old homepage drafts
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister();
        }
    });
}

createRoot(document.getElementById("root")!).render(<App />);
