import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="text-4xl">⏳</div>
            <p className="text-muted-foreground">Validando...</p>
          </>
        )}
        {status === "valid" && (
          <>
            <div className="text-4xl">📧</div>
            <h1 className="text-xl font-bold text-foreground">Cancelar inscrição</h1>
            <p className="text-muted-foreground text-sm">Você não receberá mais e-mails de notificação da Supet.</p>
            <button
              onClick={handleUnsubscribe}
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {submitting ? "Processando..." : "Confirmar cancelamento"}
            </button>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-xl font-bold text-foreground">Inscrição cancelada</h1>
            <p className="text-muted-foreground text-sm">Você foi removido da nossa lista de e-mails.</p>
          </>
        )}
        {status === "already" && (
          <>
            <div className="text-4xl">ℹ️</div>
            <h1 className="text-xl font-bold text-foreground">Já cancelado</h1>
            <p className="text-muted-foreground text-sm">Esta inscrição já foi cancelada anteriormente.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
            <p className="text-muted-foreground text-sm">Este link de cancelamento é inválido ou expirou.</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl">❌</div>
            <h1 className="text-xl font-bold text-foreground">Erro</h1>
            <p className="text-muted-foreground text-sm">Não foi possível processar seu pedido. Tente novamente.</p>
          </>
        )}
      </div>
    </div>
  );
}
