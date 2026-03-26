
-- 1. Create a security definer function to lookup user_id by email in auth.users
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = lookup_email LIMIT 1;
$$;

-- 2. Update handle_new_user to auto-link affiliates on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  RETURN NEW;
END;
$$;
