ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS value text DEFAULT '';

INSERT INTO public.feature_flags (id, enabled, value)
VALUES ('advisor_link', true, 'https://calendly.com/your-link')
ON CONFLICT (id) DO NOTHING;