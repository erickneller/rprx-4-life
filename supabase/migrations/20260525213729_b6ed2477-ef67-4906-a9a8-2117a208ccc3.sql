ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS value text;

INSERT INTO public.feature_flags (id, enabled, value, updated_at)
VALUES ('first_login_flow', true, 'profile_then_assessment', now())
ON CONFLICT (id) DO NOTHING;