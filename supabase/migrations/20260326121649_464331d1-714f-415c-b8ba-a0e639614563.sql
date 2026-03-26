
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON public.product_reviews FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert own reviews
CREATE POLICY "Users can insert own reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
