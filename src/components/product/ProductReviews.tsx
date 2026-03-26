import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string;
  created_at: string;
  user_id: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const px = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="disabled:cursor-default"
        >
          <Star
            className={`${px} transition-colors ${
              s <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const alreadyReviewed = reviews.some((r) => r.user_id === user?.id);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Faça login para avaliar");
      return;
    }
    if (alreadyReviewed) {
      toast.info("Você já avaliou este produto");
      return;
    }

    setSubmitting(true);
    const name =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Cliente";

    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
      author_name: name,
    });

    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success("Avaliação enviada!");
      setComment("");
      setRating(5);
      await fetchReviews();
    }
    setSubmitting(false);
  };

  return (
    <section className="mt-20 border-t border-border pt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">
            Avaliações
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length}{" "}
                {reviews.length === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {user && !alreadyReviewed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-2xl p-6 mb-10 space-y-4"
        >
          <p className="font-semibold text-foreground text-sm">
            Deixe sua avaliação
          </p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência (opcional)"
            className="resize-none bg-background"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </motion.div>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground mb-8">
          <a href="/login" className="text-primary hover:underline">
            Faça login
          </a>{" "}
          para deixar sua avaliação.
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma avaliação ainda. Seja o primeiro!
        </p>
      ) : (
        <AnimatePresence>
          <div className="space-y-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {r.author_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {r.author_name}
                    </span>
                    <StarRating value={r.rating} readonly size="sm" />
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground/60 mt-1 block">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
