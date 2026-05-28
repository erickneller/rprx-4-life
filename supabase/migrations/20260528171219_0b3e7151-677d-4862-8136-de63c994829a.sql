GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;

DROP POLICY IF EXISTS "Anon can read first login flow flag" ON public.feature_flags;

CREATE POLICY "Anon can read first login flow flag"
ON public.feature_flags
FOR SELECT
TO anon
USING (id = 'first_login_flow');