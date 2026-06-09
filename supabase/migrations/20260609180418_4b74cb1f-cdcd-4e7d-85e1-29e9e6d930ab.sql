
-- 1) Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 2) Replace permissive INSERT on assessment_submissions with validated check
DROP POLICY IF EXISTS "Anyone can submit an assessment" ON public.assessment_submissions;

CREATE POLICY "Anyone can submit a validated assessment"
ON public.assessment_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(phone) BETWEEN 0 AND 40
);

-- 3) Tighten course-assets bucket listing (CDN public reads unaffected)
DROP POLICY IF EXISTS "Public read course-assets" ON storage.objects;

CREATE POLICY "Admins can list course-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'course-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
