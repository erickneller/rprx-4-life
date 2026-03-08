-- Fix stale financial_goals values that stored display labels
-- instead of snake_case keys. Affects profile 793102fe (t@t.com).
--
-- Map: "Lower Insurance Costs" -> "reduce_insurance_costs"
--      "Education Funding"     -> "save_for_education"
--
-- Uses jsonb_agg + CASE to remap each array element.

UPDATE profiles
SET financial_goals = (
  SELECT jsonb_agg(
    CASE elem::text
      WHEN '"Lower Insurance Costs"' THEN '"reduce_insurance_costs"'::jsonb
      WHEN '"Education Funding"' THEN '"save_for_education"'::jsonb
      WHEN '"Increase Cash Flow"' THEN '"increase_cash_flow"'::jsonb
      WHEN '"Reduce Taxes"' THEN '"reduce_taxes"'::jsonb
      WHEN '"Save for Education"' THEN '"save_for_education"'::jsonb
      WHEN '"Improve Retirement"' THEN '"improve_retirement"'::jsonb
      WHEN '"Reduce Insurance Costs"' THEN '"reduce_insurance_costs"'::jsonb
      WHEN '"Large Purchase or Investment"' THEN '"large_purchase"'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(financial_goals) AS elem
)
WHERE financial_goals IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(financial_goals) AS g
    WHERE g LIKE '% %'
  );
