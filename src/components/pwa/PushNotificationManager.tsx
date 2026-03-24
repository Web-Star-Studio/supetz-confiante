import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!user || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);
    
    // Show prompt if permission not yet decided and user is logged in
    if (Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("push-prompt-dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);

      if (result === "granted" && user) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: "BFkdlQ0yHWosqvYLhrHVJq124UJS3Q9loArwJw3H4d5sPi8wEw7vjSupkta4RUuPxqT_k_-JYQh7eahdQnoAmkA",
        }).catch(() => null);

        if (subscription) {
          const key = subscription.getKey("p256dh");
          const auth = subscription.getKey("auth");
          if (key && auth) {
            await supabase.from("push_subscriptions").upsert({
              user_id: user.id,
              endpoint: subscription.endpoint,
              p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
              auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
            }, { onConflict: "user_id,endpoint" });
          }
        }
      }
    } catch {
      setShowPrompt(false);
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("push-prompt-dismissed", "1");
  };

  if (!user || permission !== "default") return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-background border border-border rounded-2xl p-4 shadow-2xl"
        >
          <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Ativar notificações?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Receba alertas de reposição, promoções e atualizações do seu pet.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={requestPermission}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  Ativar
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-full bg-muted text-muted-foreground px-4 py-2 text-xs font-semibold hover:bg-muted/80 transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
