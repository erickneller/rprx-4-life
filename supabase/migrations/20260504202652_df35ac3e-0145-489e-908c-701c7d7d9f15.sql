
-- 1) Drop unused backup table
DROP TABLE IF EXISTS public.strategy_catalog_v2_backup_20260428;

-- 2) Restrict prompt_engine_config SELECT to admins
DROP POLICY IF EXISTS "Authenticated can read prompt_engine_config" ON public.prompt_engine_config;
CREATE POLICY "Admins can read prompt_engine_config"
  ON public.prompt_engine_config
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Storage: scope SELECT to owner's folder. Public buckets still serve files via CDN public URL.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Motivation images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can list their own motivation images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'motivation-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4) Revoke direct column read of companies.invite_token from non-admins
REVOKE SELECT (invite_token) ON public.companies FROM anon, authenticated;
