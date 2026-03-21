
-- Allow admins to delete coupons
CREATE POLICY "Admins can delete coupons" ON public.user_coupons FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
