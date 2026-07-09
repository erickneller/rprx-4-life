
-- 1. library_videos: enforce tier on SELECT
DROP POLICY IF EXISTS "Authenticated can read library videos" ON public.library_videos;
CREATE POLICY "Authenticated can read library videos by tier"
ON public.library_videos
FOR SELECT
TO authenticated
USING (
  COALESCE(required_tier, 'free') = 'free'
  OR (required_tier = 'partner' AND public.get_subscription_tier(auth.uid()) IN ('partner','pro'))
  OR (required_tier = 'pro' AND public.get_subscription_tier(auth.uid()) = 'pro')
);

-- 2. company_members: prevent self-join without invite token
DROP POLICY IF EXISTS "Users can join a company" ON public.company_members;
CREATE POLICY "Company owners can add themselves on create"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_id AND c.owner_id = auth.uid()
  )
);

-- Token-based join via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.join_company_by_token(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_company_id
  FROM public.companies
  WHERE invite_token = _token
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, v_user_id, 'member')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  UPDATE public.profiles
  SET company_id = v_company_id,
      company_role = COALESCE(company_role, 'member')
  WHERE id = v_user_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_company_by_token(uuid) TO authenticated;
