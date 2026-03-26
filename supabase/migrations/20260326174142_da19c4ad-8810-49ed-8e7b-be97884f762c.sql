CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  message_content text NOT NULL,
  rating text NOT NULL,
  reason text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.chat_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.chat_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.chat_feedback FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));