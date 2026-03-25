
CREATE OR REPLACE FUNCTION public.get_company_invite_token(_company_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.invite_token::text
  FROM public.companies c
  WHERE c.id = _company_id
    AND (
      c.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = _company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
    )
  LIMIT 1;
$$;
