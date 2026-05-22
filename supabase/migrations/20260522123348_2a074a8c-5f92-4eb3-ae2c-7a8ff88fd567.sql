
ALTER TABLE public.dashboard_card_config
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_company_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS audience_tiers text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.dashboard_card_config
  DROP CONSTRAINT IF EXISTS dashboard_card_config_content_type_check;
ALTER TABLE public.dashboard_card_config
  ADD CONSTRAINT dashboard_card_config_content_type_check
  CHECK (content_type IS NULL OR content_type IN ('video','embed','text','image'));
