
-- Store settings table
CREATE TABLE public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage store_settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read store_settings"
  ON public.store_settings FOR SELECT
  TO public
  USING (true);

-- Product images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed default products
INSERT INTO public.products (title, subtitle, price, original_price, quantity, badge, category, active) VALUES
  ('Combo 1 Pote', 'Tratamento para 30 dias', 149.90, 199.90, 1, NULL, 'combo', true),
  ('Combo 3 Potes', 'Tratamento para 90 dias', 349.90, 599.70, 3, 'Mais Vendido', 'combo', true),
  ('Combo 5 Potes', 'Tratamento para 150 dias', 497.50, 999.50, 5, 'Melhor Custo', 'combo', true);
