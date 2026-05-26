INSERT INTO public.feature_flags (id, enabled)
VALUES ('personalized_strategy_visible', true)
ON CONFLICT (id) DO NOTHING;