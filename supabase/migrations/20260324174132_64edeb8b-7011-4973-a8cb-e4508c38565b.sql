
CREATE TABLE public.emergency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  message_content text NOT NULL,
  matched_keyword text,
  source text NOT NULL DEFAULT 'chatbot',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view emergency logs" ON public.emergency_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert emergency logs" ON public.emergency_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
