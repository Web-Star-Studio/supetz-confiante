UPDATE public.affiliates a
SET user_id = u.id
FROM auth.users u
WHERE a.email = u.email
  AND a.user_id = '00000000-0000-0000-0000-000000000000';