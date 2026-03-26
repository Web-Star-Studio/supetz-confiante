CREATE POLICY "Anyone authenticated can read active affiliates by ref_slug"
ON public.affiliates
FOR SELECT
TO authenticated
USING (status = 'active');