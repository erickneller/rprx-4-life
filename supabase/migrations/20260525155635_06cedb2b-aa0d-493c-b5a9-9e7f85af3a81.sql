
-- Replace manage policies on library_categories
DROP POLICY IF EXISTS "Admins can manage library categories" ON public.library_categories;
CREATE POLICY "Admins or library admins can manage library categories"
ON public.library_categories
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'library_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'library_admin'::app_role));

-- Replace manage policies on library_videos
DROP POLICY IF EXISTS "Admins can manage library videos" ON public.library_videos;
CREATE POLICY "Admins or library admins can manage library videos"
ON public.library_videos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'library_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'library_admin'::app_role));
