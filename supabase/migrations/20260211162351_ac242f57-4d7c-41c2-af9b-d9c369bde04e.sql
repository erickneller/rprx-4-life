UPDATE saved_plans 
SET content = jsonb_set(
  content::jsonb,
  '{steps}',
  '["Focus on paying off the smallest debts first to build momentum and reduce overall interest costs.", "Adjust your tax withholding to increase your monthly cash flow instead of receiving a large refund at year-end.", "Conduct a comprehensive review of your insurance policies to ensure you are not overpaying for coverage you do not need."]'::jsonb
)
WHERE id = '1151e85a-45b7-4391-a8b1-9f1e25e3854f';