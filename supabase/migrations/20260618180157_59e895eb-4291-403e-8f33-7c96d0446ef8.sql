
DROP POLICY IF EXISTS "Authenticated read ghl mappings" ON public.ghl_field_mappings;
CREATE POLICY "Admins read ghl mappings" ON public.ghl_field_mappings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated read ghl product map" ON public.ghl_product_tier_map;
CREATE POLICY "Admins read ghl product map" ON public.ghl_product_tier_map FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
