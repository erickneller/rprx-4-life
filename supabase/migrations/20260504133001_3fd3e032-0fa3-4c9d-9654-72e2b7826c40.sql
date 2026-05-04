-- Replace strategy_definitions table with a view over strategy_catalog_v2
DROP POLICY IF EXISTS "Admins can delete strategies" ON public.strategy_definitions;
DROP POLICY IF EXISTS "Admins can insert strategies" ON public.strategy_definitions;
DROP POLICY IF EXISTS "Admins can update strategies" ON public.strategy_definitions;
DROP POLICY IF EXISTS "Authenticated users can read strategy definitions" ON public.strategy_definitions;

DROP TABLE IF EXISTS public.strategy_definitions CASCADE;

CREATE VIEW public.strategy_definitions
WITH (security_invoker = true)
AS
SELECT
  v.id,
  v.horseman_type,
  v.title AS name,
  v.strategy_details AS description,
  v.difficulty,
  v.estimated_impact_display AS estimated_impact,
  v.implementation_steps AS steps,
  v.is_active,
  v.sort_order,
  v.created_at,
  v.tax_return_line_or_area,
  CASE
    WHEN jsonb_typeof(v.who_best_for) = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(v.who_best_for))
    ELSE ARRAY[]::text[]
  END AS financial_goals
FROM public.strategy_catalog_v2 v;

GRANT SELECT ON public.strategy_definitions TO authenticated;
GRANT SELECT ON public.strategy_definitions TO anon;