
-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  instagram text,
  channel_type text NOT NULL DEFAULT 'influencer',
  status text NOT NULL DEFAULT 'pending',
  commission_percent numeric NOT NULL DEFAULT 10,
  coupon_code text UNIQUE,
  ref_slug text UNIQUE,
  total_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  pix_key text
);

-- Affiliate sales table
CREATE TABLE public.affiliate_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_total numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Affiliate payouts table
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'pix',
  pix_key text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Affiliate clicks table
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- RLS: Affiliates - users see own, admins see all
CREATE POLICY "Users can view own affiliate" ON public.affiliates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert affiliate application" ON public.affiliates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update affiliates" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own affiliate" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Affiliate sales
CREATE POLICY "Affiliates can view own sales" ON public.affiliate_sales
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage affiliate_sales" ON public.affiliate_sales
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Affiliate payouts
CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payouts
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Affiliates can insert own payouts" ON public.affiliate_payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage affiliate_payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Affiliate clicks - public insert, affiliates/admins read
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Affiliates can view own clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Trigger: register affiliate sale when order is created with affiliate coupon
CREATE OR REPLACE FUNCTION public.register_affiliate_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  aff record;
  coupon_used text;
  ref_used text;
  commission numeric;
BEGIN
  -- Check if order items contain coupon_code metadata
  coupon_used := NEW.items->0->>'coupon_code';
  ref_used := NEW.items->0->>'affiliate_ref';

  -- Try to find affiliate by coupon code
  IF coupon_used IS NOT NULL THEN
    SELECT * INTO aff FROM public.affiliates WHERE coupon_code = coupon_used AND status = 'active' LIMIT 1;
  END IF;

  -- If not found, try by ref slug
  IF aff IS NULL AND ref_used IS NOT NULL THEN
    SELECT * INTO aff FROM public.affiliates WHERE ref_slug = ref_used AND status = 'active' LIMIT 1;
  END IF;

  -- If affiliate found, create sale record
  IF aff IS NOT NULL THEN
    commission := ROUND((NEW.total * aff.commission_percent / 100)::numeric, 2);
    
    INSERT INTO public.affiliate_sales (affiliate_id, order_id, order_total, commission_amount, status)
    VALUES (aff.id, NEW.id, NEW.total, commission, 'pending');
    
    -- Update total earned
    UPDATE public.affiliates SET total_earned = total_earned + commission WHERE id = aff.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_check_affiliate
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.register_affiliate_sale();
