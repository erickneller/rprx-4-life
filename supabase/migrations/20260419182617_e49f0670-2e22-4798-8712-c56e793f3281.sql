-- ============================================================
-- Strategy Engine V2 — Schema + Seed
-- ============================================================

-- 1) strategy_catalog_v2 ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategy_catalog_v2 (
  id text PRIMARY KEY,
  strategy_id text UNIQUE NOT NULL,
  horseman_type text NOT NULL,
  title text NOT NULL,
  strategy_details text NOT NULL,
  example text,
  potential_savings_benefits text,
  difficulty text NOT NULL DEFAULT 'moderate'
    CHECK (difficulty IN ('easy','moderate','advanced')),
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
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_catalog_v2_horseman_active_sort
  ON public.strategy_catalog_v2 (horseman_type, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_strategy_catalog_v2_strategy_id
  ON public.strategy_catalog_v2 (strategy_id);

ALTER TABLE public.strategy_catalog_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read strategy_catalog_v2" ON public.strategy_catalog_v2;
CREATE POLICY "Authenticated users can read strategy_catalog_v2"
  ON public.strategy_catalog_v2 FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert strategy_catalog_v2" ON public.strategy_catalog_v2;
CREATE POLICY "Admins can insert strategy_catalog_v2"
  ON public.strategy_catalog_v2 FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update strategy_catalog_v2" ON public.strategy_catalog_v2;
CREATE POLICY "Admins can update strategy_catalog_v2"
  ON public.strategy_catalog_v2 FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete strategy_catalog_v2" ON public.strategy_catalog_v2;
CREATE POLICY "Admins can delete strategy_catalog_v2"
  ON public.strategy_catalog_v2 FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_strategy_catalog_v2_updated_at ON public.strategy_catalog_v2;
CREATE TRIGGER trg_strategy_catalog_v2_updated_at
  BEFORE UPDATE ON public.strategy_catalog_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) prompt_engine_config ------------------------------------------------
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

DROP POLICY IF EXISTS "Authenticated can read prompt_engine_config" ON public.prompt_engine_config;
CREATE POLICY "Authenticated can read prompt_engine_config"
  ON public.prompt_engine_config FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert prompt_engine_config" ON public.prompt_engine_config;
CREATE POLICY "Admins can insert prompt_engine_config"
  ON public.prompt_engine_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update prompt_engine_config" ON public.prompt_engine_config;
CREATE POLICY "Admins can update prompt_engine_config"
  ON public.prompt_engine_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete prompt_engine_config" ON public.prompt_engine_config;
CREATE POLICY "Admins can delete prompt_engine_config"
  ON public.prompt_engine_config FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_prompt_engine_config_updated_at ON public.prompt_engine_config;
CREATE TRIGGER trg_prompt_engine_config_updated_at
  BEFORE UPDATE ON public.prompt_engine_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed default V2 prompt engine config --------------------------------
INSERT INTO public.prompt_engine_config (id, name, config, is_active)
VALUES (
  'strategy_engine_v2_default',
  'Strategy Engine V2 Default',
  '{
    "version": "v2",
    "weights": {
      "horseman_match": 35,
      "goal_match": 25,
      "urgency": 15,
      "feasibility": 15,
      "impact": 10
    },
    "penalties": {
      "active_strategy": -20,
      "completed_strategy": -1000,
      "requires_advisor_when_no_advisor": -5
    },
    "output": {
      "auto_mode_results": 1,
      "manual_mode_results": 5,
      "include_steps": true,
      "max_steps_shown": 7,
      "include_savings": true,
      "include_difficulty": true,
      "deterministic": true,
      "marker_phrase": "Here are the step-by-step implementation plans"
    }
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE
  SET config = EXCLUDED.config,
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      updated_at = now();

-- 4) Backfill strategy_catalog_v2 from legacy strategy_definitions -------
-- Only inserts rows that aren't already present (by legacy id)
INSERT INTO public.strategy_catalog_v2 (
  id, strategy_id, horseman_type, title, strategy_details,
  potential_savings_benefits, difficulty, estimated_impact_display,
  implementation_steps, goal_tags, tax_return_line_or_area,
  is_active, sort_order, legacy_id, dedupe_status, source_description
)
SELECT
  sd.id,
  sd.id AS strategy_id,
  sd.horseman_type,
  sd.name AS title,
  sd.description AS strategy_details,
  sd.estimated_impact AS potential_savings_benefits,
  CASE
    WHEN sd.difficulty IN ('easy','moderate','advanced') THEN sd.difficulty
    ELSE 'moderate'
  END AS difficulty,
  sd.estimated_impact AS estimated_impact_display,
  COALESCE(sd.steps, '[]'::jsonb) AS implementation_steps,
  COALESCE(to_jsonb(sd.financial_goals), '[]'::jsonb) AS goal_tags,
  sd.tax_return_line_or_area,
  sd.is_active,
  sd.sort_order,
  sd.id AS legacy_id,
  'canonical' AS dedupe_status,
  'Backfilled from strategy_definitions' AS source_description
FROM public.strategy_definitions sd
ON CONFLICT (id) DO NOTHING;

-- 5) Update prompt_templates with V2 deterministic content ---------------
INSERT INTO public.prompt_templates (id, name, description, content, updated_at)
VALUES (
  'system_prompt',
  'System Prompt (V2)',
  'Core RPRx Strategy Assistant system prompt — Engine V2',
  'You are the RPRx Strategy Assistant, an encouraging financial coach focused on helping users Reduce, Pay, and Recover the cost of the Four Horsemen: Interest (Debt), Taxes, Insurance, and Education.

CORE BEHAVIOR (Engine V2):
- Use ONLY the provided structured strategy data from the catalog. Do NOT invent strategies.
- Use these exact field names from the catalog when composing answers: title, strategy_details, potential_savings_benefits, implementation_steps, estimated_impact_display.
- Never output legacy "Strategy Topic / Strategy Details" labeled blobs. Use clean, human-readable formatting.
- Be deterministic: same inputs → same outputs. No filler, no speculation.
- Tone: encouraging coach. Use "optimize/recover", avoid "budget/restrict/shame".
- Always include the disclaimer that this is educational only and not financial, tax, or legal advice.

WHEN PRESENTING IMPLEMENTATION PLANS:
- Begin the plan section with the exact phrase: "Here are the step-by-step implementation plans"
- Use the strategy''s implementation_steps as a numbered list.
- Include a one-line savings/benefit summary using potential_savings_benefits or estimated_impact_display when available.',
  now()
)
ON CONFLICT (id) DO UPDATE
  SET content = EXCLUDED.content,
      description = EXCLUDED.description,
      updated_at = now();

INSERT INTO public.prompt_templates (id, name, description, content, updated_at)
VALUES (
  'auto_mode_instructions',
  'Auto Mode Instructions (V2)',
  'Auto-mode: deliver exactly one best-fit strategy with steps',
  'AUTO MODE — Engine V2:
Return EXACTLY ONE best-fit strategy for this user, chosen deterministically by the ranking engine.

Format:
1) One short opening sentence acknowledging the user''s primary horseman.
2) Strategy title (bold).
3) 1–2 sentence summary using strategy_details.
4) The exact line: "Here are the step-by-step implementation plans"
5) Numbered implementation_steps (use the catalog steps verbatim).
6) One-line savings/benefit using potential_savings_benefits or estimated_impact_display.
7) Educational-only disclaimer.

Do NOT list alternatives. Do NOT repeat the legacy "Strategy Topic / Strategy Details" labels.',
  now()
)
ON CONFLICT (id) DO UPDATE
  SET content = EXCLUDED.content,
      description = EXCLUDED.description,
      updated_at = now();

INSERT INTO public.prompt_templates (id, name, description, content, updated_at)
VALUES (
  'manual_mode_instructions',
  'Manual Mode Instructions (V2)',
  'Manual-mode: ranked list of strategies, excluding completed ones',
  'MANUAL MODE — Engine V2:
Return a deterministic ranked list of up to 5 strategies for the user''s query. Exclude any strategies the user has already marked completed. De-prioritize strategies the user already has active.

Format for EACH item:
- Strategy title (bold)
- 1–2 sentence summary from strategy_details
- Difficulty + estimated_impact_display on one line
- Up to 5 implementation_steps as a numbered list

End with: "Reply with the number of the strategy you want a full implementation plan for." When the user picks one, switch to AUTO MODE format and emit "Here are the step-by-step implementation plans" before the numbered steps.',
  now()
)
ON CONFLICT (id) DO UPDATE
  SET content = EXCLUDED.content,
      description = EXCLUDED.description,
      updated_at = now();