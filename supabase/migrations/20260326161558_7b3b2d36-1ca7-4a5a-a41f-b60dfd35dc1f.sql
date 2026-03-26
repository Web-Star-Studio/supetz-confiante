
-- Allow admins to read email_send_log for EmailAnalyticsPanel
CREATE POLICY "Admins can read email send log"
  ON public.email_send_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
