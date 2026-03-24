
DROP POLICY "Service role can insert notifications" ON public.user_notifications;
CREATE POLICY "Authenticated can insert own notifications" ON public.user_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
