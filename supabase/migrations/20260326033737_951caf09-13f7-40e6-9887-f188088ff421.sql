
CREATE POLICY "Admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete affiliates"
ON public.affiliates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
