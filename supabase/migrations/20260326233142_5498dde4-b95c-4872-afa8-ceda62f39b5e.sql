
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

  -- Grant 7 days free AI access
  INSERT INTO public.ai_access_credits (user_id, days_granted, expires_at)
  VALUES (NEW.id, 7, now() + interval '7 days');

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
