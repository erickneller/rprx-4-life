CREATE INDEX IF NOT EXISTS calculator_runs_user_type_created_idx ON public.calculator_runs (user_id, calculator_type, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculator_runs TO authenticated;
GRANT ALL ON public.calculator_runs TO service_role;