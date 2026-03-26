import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";

const FEEDBACK_REASONS = [
  "Resposta incorreta",
  "Não entendeu minha pergunta",
  "Pouco útil",
  "Outro",
];

interface Props {
  onSubmit: (reason: string, comment: string) => void;
  onCancel: () => void;
}

export default function NegativeFeedbackForm({ onSubmit, onCancel }: Props) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-muted/50 border border-border rounded-2xl p-3 space-y-2.5 mt-1">
        <p className="text-[11px] font-semibold text-foreground">O que houve com essa resposta?</p>
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${
                reason === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 300))}
          placeholder="Comentário opcional (até 300 caracteres)"
          rows={2}
          className="w-full text-[12px] rounded-xl bg-background border border-border px-3 py-2 outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!reason}
            onClick={() => onSubmit(reason, comment)}
            className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Send className="h-3 w-3" /> Enviar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
