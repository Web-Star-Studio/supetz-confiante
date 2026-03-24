
CREATE TABLE public.ai_cached_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pet_id, mode)
);

ALTER TABLE public.ai_cached_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cached content" ON public.ai_cached_content
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cached content" ON public.ai_cached_content
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cached content" ON public.ai_cached_content
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cached content" ON public.ai_cached_content
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
