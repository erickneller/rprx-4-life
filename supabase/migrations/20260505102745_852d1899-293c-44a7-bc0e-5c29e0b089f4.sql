UPDATE public.prompt_engine_config
SET config = jsonb_set(
  jsonb_set(config, '{output,auto_mode_multi_plans}', '3'::jsonb),
  '{output,manual_mode_multi_plans}', '3'::jsonb
),
updated_at = now()
WHERE id = 'strategy_engine_v2_default';