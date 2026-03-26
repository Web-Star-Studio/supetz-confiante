
-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  user_id uuid,
  source text NOT NULL DEFAULT 'footer',
  status text NOT NULL DEFAULT 'active',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anonymous users can subscribe (insert only email/name/source)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can read all subscribers
CREATE POLICY "Admins can read all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update subscribers
CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete subscribers
CREATE POLICY "Admins can delete subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage (for triggers)
CREATE POLICY "Service role can manage newsletter"
  ON public.newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update handle_new_user to auto-link newsletter subscribers
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Auto-link affiliate if exists with placeholder user_id
  UPDATE public.affiliates
  SET user_id = NEW.id
  WHERE email = COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')
    AND user_id = '00000000-0000-0000-0000-000000000000';

  -- Auto-link newsletter subscriber and auto-subscribe if not yet
  INSERT INTO public.newsletter_subscribers (email, user_id, source, status)
  VALUES (COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'), NEW.id, 'registration', 'active')
  ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
  
  RETURN NEW;
END;
$function$;
