UPDATE public.strategy_catalog_v2
SET implementation_steps = CASE horseman_type
  WHEN 'interest' THEN '[
    "Review your current debt balances, interest rates, and minimum payments to understand your starting point.",
    "Confirm whether this strategy fits your situation by checking eligibility (credit score, account types, lender terms).",
    "Contact the relevant lender, servicer, or financial institution to begin the process or request the change.",
    "Redirect any freed-up cash flow toward the highest-interest debt to accelerate payoff.",
    "Track progress monthly and adjust payments as balances and rates change."
  ]'::jsonb
  WHEN 'taxes' THEN '[
    "Gather your most recent tax return, W-2/1099s, and year-to-date pay stubs to establish a baseline.",
    "Confirm eligibility for this strategy based on filing status, income limits, and account types.",
    "Update payroll elections, account contributions, or withholdings to implement the change.",
    "Document the action (forms filed, contributions made) and save records for tax filing.",
    "Review impact at year-end with a tax professional and adjust for the next tax year."
  ]'::jsonb
  WHEN 'insurance' THEN '[
    "Inventory your current policies (type, coverage limits, deductibles, premiums, beneficiaries).",
    "Identify gaps or overlaps relative to this strategy and your household needs.",
    "Request quotes or coverage changes from at least two licensed providers for comparison.",
    "Update beneficiaries, riders, and policy details to reflect your current situation.",
    "Schedule an annual policy review to keep coverage aligned with life changes."
  ]'::jsonb
  WHEN 'education' THEN '[
    "Estimate the total education cost and timeline you are planning for.",
    "Confirm the right account or vehicle (529, ESA, custodial, etc.) for your state and goals.",
    "Open or update the account and set an automatic monthly contribution.",
    "Choose an age-based or risk-appropriate investment allocation inside the account.",
    "Review balances and contributions annually and adjust as the timeline shortens."
  ]'::jsonb
  ELSE '[
    "Review your current situation and confirm the goal this strategy supports.",
    "Verify eligibility and gather any required documents or account information.",
    "Take the primary action required to implement the strategy.",
    "Set up tracking (calendar reminder, spreadsheet, or app) to monitor progress.",
    "Review results after 30, 60, and 90 days and adjust as needed."
  ]'::jsonb
END
WHERE is_active = true
  AND jsonb_array_length(implementation_steps) = 0;