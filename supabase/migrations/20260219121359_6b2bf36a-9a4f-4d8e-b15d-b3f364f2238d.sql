
-- Add new profile columns for RPRx personalized score

-- River (Emergency Savings)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_fund_balance numeric NULL DEFAULT 0;

-- Lake (Retirement) - new field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer_match_captured text NULL;

-- Tax Efficiency
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_advantaged_accounts jsonb NULL DEFAULT '[]'::jsonb;

-- Stress & Control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stress_money_worry text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stress_emergency_confidence text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stress_control_feeling text NULL;

-- Score storage (pillar breakdown)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_river numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_lake numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_rainbow numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_tax numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_stress numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_score_total numeric NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rprx_grade text NULL DEFAULT 'at_risk';

-- Change rprx_score from integer to numeric
ALTER TABLE public.profiles ALTER COLUMN rprx_score TYPE numeric USING rprx_score::numeric;
