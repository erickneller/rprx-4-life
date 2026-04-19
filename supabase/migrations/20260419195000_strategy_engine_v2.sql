-- Strategy Engine V2: canonical strategy catalog + prompt engine config + prompt template refresh

-- 1) Canonical catalog table
CREATE TABLE IF NOT EXISTS public.strategy_catalog_v2 (
  id text PRIMARY KEY,
  strategy_id text NOT NULL UNIQUE,
  horseman_type text NOT NULL,
  title text NOT NULL,
  strategy_details text NOT NULL,
  example text,
  potential_savings_benefits text,
  difficulty text NOT NULL DEFAULT 'moderate',
  estimated_impact_min numeric,
  estimated_impact_max numeric,
  estimated_impact_display text,
  implementation_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  goal_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  who_best_for jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_to_impact text,
  effort_level text,
  requires_advisor boolean NOT NULL DEFAULT false,
  tax_return_line_or_area text,
  dedupe_status text NOT NULL DEFAULT 'canonical',
  canonical_strategy_id text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  source_description text,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strategy_catalog_v2_difficulty_check CHECK (difficulty IN ('easy','moderate','advanced'))
);

CREATE INDEX IF NOT EXISTS idx_strategy_catalog_v2_horseman_active
  ON public.strategy_catalog_v2 (horseman_type, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_strategy_catalog_v2_strategy_id
  ON public.strategy_catalog_v2 (strategy_id);

ALTER TABLE public.strategy_catalog_v2 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='strategy_catalog_v2' AND policyname='Authenticated users can read strategy catalog v2'
  ) THEN
    CREATE POLICY "Authenticated users can read strategy catalog v2"
      ON public.strategy_catalog_v2 FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='strategy_catalog_v2' AND policyname='Admins can insert strategy catalog v2'
  ) THEN
    CREATE POLICY "Admins can insert strategy catalog v2"
      ON public.strategy_catalog_v2 FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='strategy_catalog_v2' AND policyname='Admins can update strategy catalog v2'
  ) THEN
    CREATE POLICY "Admins can update strategy catalog v2"
      ON public.strategy_catalog_v2 FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='strategy_catalog_v2' AND policyname='Admins can delete strategy catalog v2'
  ) THEN
    CREATE POLICY "Admins can delete strategy catalog v2"
      ON public.strategy_catalog_v2 FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 2) Prompt engine config table (versioned deterministic scoring/behavior)
CREATE TABLE IF NOT EXISTS public.prompt_engine_config (
  id text PRIMARY KEY,
  name text NOT NULL,
  config jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.prompt_engine_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='prompt_engine_config' AND policyname='Authenticated users can read prompt engine config'
  ) THEN
    CREATE POLICY "Authenticated users can read prompt engine config"
      ON public.prompt_engine_config FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='prompt_engine_config' AND policyname='Admins can insert prompt engine config'
  ) THEN
    CREATE POLICY "Admins can insert prompt engine config"
      ON public.prompt_engine_config FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='prompt_engine_config' AND policyname='Admins can update prompt engine config'
  ) THEN
    CREATE POLICY "Admins can update prompt engine config"
      ON public.prompt_engine_config FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='prompt_engine_config' AND policyname='Admins can delete prompt engine config'
  ) THEN
    CREATE POLICY "Admins can delete prompt engine config"
      ON public.prompt_engine_config FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 3) Seed default v2 engine config
INSERT INTO public.prompt_engine_config (id, name, config, is_active)
VALUES (
  'strategy_engine_v2_default',
  'Strategy Engine V2 Default',
  jsonb_build_object(
    'engine_version', 'v2',
    'mode_defaults', jsonb_build_object('free_tier', 'auto', 'paid_tier', 'manual'),
    'weights', jsonb_build_object(
      'horseman_primary', 35,
      'horseman_secondary', 20,
      'horseman_third', 10,
      'goal_strong', 20,
      'goal_partial', 10,
      'urgency', 20,
      'feasibility', 15,
      'impact', 10,
      'active_penalty', -20,
      'completed_penalty', -100
    ),
    'output', jsonb_build_object(
      'auto_top_n', 1,
      'manual_page_size', 10,
      'include_disclaimer', true,
      'referral_url', 'https://rprx4life.com'
    )
  ),
  true
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- 4) Backfill v2 catalog from legacy table (safe default mapping)
INSERT INTO public.strategy_catalog_v2 (
  id,
  strategy_id,
  horseman_type,
  title,
  strategy_details,
  potential_savings_benefits,
  difficulty,
  estimated_impact_display,
  implementation_steps,
  goal_tags,
  tax_return_line_or_area,
  is_active,
  sort_order,
  source_description,
  legacy_id
)
SELECT
  sd.id,
  sd.id,
  sd.horseman_type,
  sd.name,
  sd.description,
  sd.strategy_summary,
  CASE
    WHEN lower(sd.difficulty) IN ('quick_win', 'quick win') THEN 'easy'
    WHEN lower(sd.difficulty) IN ('easy') THEN 'easy'
    WHEN lower(sd.difficulty) IN ('advanced', 'hard') THEN 'advanced'
    ELSE 'moderate'
  END,
  sd.estimated_impact,
  COALESCE(sd.steps, '[]'::jsonb),
  COALESCE(to_jsonb(sd.financial_goals), '[]'::jsonb),
  sd.tax_return_line_or_area,
  COALESCE(sd.is_active, true),
  COALESCE(sd.sort_order, 0),
  sd.description,
  sd.id
FROM public.strategy_definitions sd
ON CONFLICT (id) DO NOTHING;

-- 5) Refresh prompt templates for v2 strategy engine behavior
INSERT INTO public.prompt_templates (id, name, content, description)
VALUES
(
  'system_prompt',
  'System Prompt',
  'You are the RPRx Strategy Assistant.\n\nUse only the strategy data supplied in context and follow deterministic selection rules.\nDo not invent user facts.\nNever recommend a completed strategy.\nPrefer practical, fast-win, low-friction strategies when urgency is high.\n\nAlways include a clear educational disclaimer and refer users to rprx4life.com for professional guidance.',
  'Core behavior and guardrails for deterministic strategy engine v2'
),
(
  'auto_mode_instructions',
  'Auto Mode Instructions',
  'AUTO MODE: return exactly one best-fit strategy.\n\nPrioritize:\n1) highest fit score\n2) urgency relief\n3) feasibility (easy/moderate before advanced)\n4) clear implementation steps\n\nOutput:\n- Strategy name + strategy_id\n- Why it fits this user\n- Estimated impact\n- Numbered implementation steps\n- Disclaimer',
  'Single-strategy deterministic output for auto mode'
),
(
  'manual_mode_instructions',
  'Manual Mode Instructions',
  'MANUAL MODE: return top 10 ranked strategies per page.\n\nRules:\n- Exclude completed strategies\n- Deprioritize already-active strategies\n- Keep output concise and skimmable\n- Include strategy_id for follow-up detail requests\n\nOutput each strategy with:\n- Rank\n- strategy_id + title\n- Short fit reason\n- Estimated impact\n- Difficulty\n\nIf more strategies exist, tell user they can request next page.',
  'Paginated deterministic ranking output for manual mode'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();
