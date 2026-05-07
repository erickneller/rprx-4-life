INSERT INTO public.feature_flags (id, enabled, value) VALUES
  ('rprx_score_visible', true, ''),
  ('xp_score_visible', true, '')
ON CONFLICT (id) DO NOTHING;