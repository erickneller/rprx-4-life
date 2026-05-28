DROP FUNCTION public.lookup_company_by_invite_token(uuid);
CREATE OR REPLACE FUNCTION public.lookup_company_by_invite_token(_token uuid)
 RETURNS TABLE(id uuid, name text, first_login_flow text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.first_login_flow
  FROM public.companies c
  WHERE c.invite_token = _token
  LIMIT 1;
$function$;