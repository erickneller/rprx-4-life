CREATE OR REPLACE FUNCTION public.lookup_company_by_invite_token(_token uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.companies c
  WHERE c.invite_token = _token
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "companies_public_read" ON public.companies;