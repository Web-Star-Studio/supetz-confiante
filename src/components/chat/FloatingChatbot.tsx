import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown,
  Sparkles, Trash2, PawPrint, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import supetIaAvatar from "@/assets/supet-ia-avatar.png";

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  feedback?: "positive" | "negative" | null;
  isStreaming?: boolean;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

const quickQuestions = [
  "Quais suplementos vocês vendem?",
  "Como usar o suplemento?",
  "Qual a dosagem pro meu pet?",
  "Como acompanhar meu pedido?",
];

export default function FloatingChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Msg = { role: "user", content };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    let assistantText = "";

    const upsert = (chunk: string) => {
      assistantText += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.isStreaming) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: "assistant", content: assistantText, isStreaming: true }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro de rede" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { /* partial */ }
        }
      }

      // Finalize streaming flag
      setMessages((prev) =>
        prev.map((m, i) => i === prev.length - 1 && m.isStreaming ? { ...m, isStreaming: false } : m)
      );

      // Save assistant response if logged in
      if (user && assistantText) {
        const { data } = await supabase.from("chat_messages").insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: "assistant",
          content: assistantText,
        }).select("id").single();

        if (data) {
          setMessages((prev) =>
            prev.map((m, i) => i === prev.length - 1 ? { ...m, id: data.id } : m)
          );
        }
      }

      if (!open) setUnread((n) => n + 1);
    } catch (e: any) {
      toast.error(e.message);
      // Remove streaming message on error
      setMessages((prev) => prev.filter((m) => !m.isStreaming));
    }

    setLoading(false);
  }, [input, loading, messages, conversationId, user, open]);

  const handleFeedback = async (index: number, feedback: "positive" | "negative") => {
    const msg = messages[index];
    if (!msg.id || !user) return;

    const newFeedback = msg.feedback === feedback ? null : feedback;

    setMessages((prev) =>
      prev.map((m, i) => i === index ? { ...m, feedback: newFeedback } : m)
    );

    await supabase
      .from("chat_messages")
      .update({ feedback: newFeedback })
      .eq("id", msg.id);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[480px] md:h-[560px] max-h-[calc(100vh-6rem)] rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary-foreground/20">
                <img src={supetIaAvatar} alt="Super IA" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-primary-foreground">Super IA</h3>
                <p className="text-[11px] text-primary-foreground/70 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Online agora
                </p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clearChat} className="h-8 w-8 rounded-full hover:bg-primary-foreground/10 flex items-center justify-center transition-colors" title="Limpar conversa">
                    <Trash2 className="h-3.5 w-3.5 text-primary-foreground/70" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full hover:bg-primary-foreground/10 flex items-center justify-center transition-colors">
                  <ChevronDown className="h-4.5 w-4.5 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <PawPrint className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Olá! 🐾
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sou a Super IA da Supet. Como posso ajudar?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQuestions.map((q) => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="text-[11px] text-left bg-primary/5 hover:bg-primary/10 text-foreground px-3 py-2.5 rounded-2xl transition-colors border border-border/50">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] space-y-1">
                    <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:mb-1.5 [&>ol]:mb-1.5">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                          {m.isStreaming && (
                            <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5 align-text-bottom" />
                          )}
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Feedback buttons for assistant messages */}
                    {m.role === "assistant" && !m.isStreaming && user && (
                      <div className="flex items-center gap-1 px-1">
                        <button
                          onClick={() => handleFeedback(i, "positive")}
                          className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                            m.feedback === "positive"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                              : "hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "negative")}
                          className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                            m.feedback === "negative"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                              : "hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground"
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              {!user && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Faça login para salvar suas conversas e ter respostas personalizadas
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
