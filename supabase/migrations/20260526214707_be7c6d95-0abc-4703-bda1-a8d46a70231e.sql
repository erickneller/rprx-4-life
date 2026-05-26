INSERT INTO public.feature_flags (id, enabled)
VALUES ('profile_achievements_visible', true)
ON CONFLICT (id) DO NOTHING;