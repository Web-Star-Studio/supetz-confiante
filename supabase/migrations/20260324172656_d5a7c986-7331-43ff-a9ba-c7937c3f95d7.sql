
CREATE TABLE public.ai_access_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  days_granted integer NOT NULL DEFAULT 30,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.ai_access_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.ai_access_credits
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.grant_ai_access_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  item_count integer;
  latest_expiry timestamptz;
  new_start timestamptz;
BEGIN
  SELECT COALESCE(SUM((item->>'quantity')::integer), 1)
  INTO item_count
  FROM jsonb_array_elements(NEW.items) AS item;

  SELECT MAX(expires_at) INTO latest_expiry
  FROM public.ai_access_credits WHERE user_id = NEW.user_id;

  new_start := GREATEST(COALESCE(latest_expiry, now()), now());

  INSERT INTO public.ai_access_credits (user_id, order_id, days_granted, expires_at)
  VALUES (NEW.user_id, NEW.id, item_count * 30, new_start + (item_count * 30 || ' days')::interval);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_grant_ai_access
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.grant_ai_access_on_order();
