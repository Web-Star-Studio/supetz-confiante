
-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'purchase',
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can also manage points
CREATE POLICY "Admins can manage points" ON public.loyalty_points FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create user_coupons table
CREATE TABLE public.user_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupons" ON public.user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own coupons" ON public.user_coupons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage coupons" ON public.user_coupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-generate loyalty points on order creation
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award 1 point per R$1 spent
  INSERT INTO public.loyalty_points (user_id, points, source, description, order_id)
  VALUES (
    NEW.user_id,
    GREATEST(1, FLOOR(NEW.total)),
    'purchase',
    'Pontos por compra #' || LEFT(NEW.id::text, 8),
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_award_points
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points();

-- Create welcome coupon trigger for new users
CREATE OR REPLACE FUNCTION public.create_welcome_coupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_coupons (user_id, code, discount_type, discount_value, min_order_value, expires_at)
  VALUES (
    NEW.id,
    'BEM-VINDO-' || LEFT(gen_random_uuid()::text, 6),
    'percentage',
    10,
    50,
    now() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_user_welcome_coupon
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_welcome_coupon();
