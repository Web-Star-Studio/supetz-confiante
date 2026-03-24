
-- User notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, read) WHERE read = false;

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for user notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Trigger to create user notification on order status change
CREATE OR REPLACE FUNCTION public.notify_user_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.user_notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE NEW.status
        WHEN 'confirmed' THEN '✅ Pedido confirmado!'
        WHEN 'shipped' THEN '📦 Pedido enviado!'
        WHEN 'delivered' THEN '🎉 Pedido entregue!'
        WHEN 'cancelled' THEN '❌ Pedido cancelado'
        ELSE '📋 Atualização do pedido'
      END,
      'Pedido #' || LEFT(NEW.id::text, 8) || ' — ' || CASE NEW.status
        WHEN 'confirmed' THEN 'Seu pedido foi confirmado e está sendo preparado.'
        WHEN 'shipped' THEN 'Seu pedido está a caminho!'
        WHEN 'delivered' THEN 'Seu pedido foi entregue. Aproveite!'
        WHEN 'cancelled' THEN 'Seu pedido foi cancelado.'
        ELSE 'Status atualizado para: ' || NEW.status
      END,
      'order',
      '/perfil'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_order_update();

-- Trigger to notify user on new coupon
CREATE OR REPLACE FUNCTION public.notify_user_new_coupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    '🎁 Novo cupom disponível!',
    'Você recebeu o cupom ' || NEW.code || ' com ' || 
    CASE NEW.discount_type 
      WHEN 'percentage' THEN NEW.discount_value || '% de desconto'
      ELSE 'R$' || NEW.discount_value || ' de desconto'
    END || '!',
    'coupon',
    '/perfil'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_coupon
  AFTER INSERT ON public.user_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_new_coupon();

-- Trigger to notify user on loyalty points earned
CREATE OR REPLACE FUNCTION public.notify_user_points_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    '⭐ Pontos conquistados!',
    'Você ganhou ' || NEW.points || ' pontos de fidelidade. ' || COALESCE(NEW.description, ''),
    'points',
    '/perfil'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_points_earned
  AFTER INSERT ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_points_earned();
