ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS join_video_url text;

DROP FUNCTION IF EXISTS public.lookup_company_by_invite_token(uuid);
CREATE OR REPLACE FUNCTION public.lookup_company_by_invite_token(_token uuid)
 RETURNS TABLE(id uuid, name text, first_login_flow text, join_video_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.first_login_flow, c.join_video_url
  FROM public.companies c
  WHERE c.invite_token = _token
  LIMIT 1;
$function$;