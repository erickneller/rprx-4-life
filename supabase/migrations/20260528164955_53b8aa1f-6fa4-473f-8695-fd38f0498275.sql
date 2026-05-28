CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT COALESCE(tier_override, tier)::text
       FROM public.user_subscriptions
       WHERE user_id = _user_id
       LIMIT 1),
    (SELECT c.plan
       FROM public.profiles p
       JOIN public.companies c ON c.id = p.company_id
       WHERE p.id = _user_id
         AND c.plan IN ('partner','pro')
       LIMIT 1),
    'free'
  )
$$;