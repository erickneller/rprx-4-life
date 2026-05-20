
CREATE TABLE IF NOT EXISTS public.profile_field_settings (
  field_key text PRIMARY KEY,
  label text NOT NULL,
  section text NOT NULL DEFAULT 'basic',
  visible boolean NOT NULL DEFAULT true,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_field_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read profile_field_settings"
  ON public.profile_field_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins insert profile_field_settings"
  ON public.profile_field_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update profile_field_settings"
  ON public.profile_field_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete profile_field_settings"
  ON public.profile_field_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_profile_field_settings_updated_at
  BEFORE UPDATE ON public.profile_field_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.profile_field_settings (field_key, label, section, visible, required, sort_order) VALUES
  -- Basic identity
  ('full_name', 'Full Name', 'basic', true, true, 10),
  ('phone', 'Phone', 'basic', true, true, 20),
  ('company', 'Company', 'basic', true, false, 30),
  -- Cash flow (wizard step 1)
  ('monthly_income', 'Monthly Take-Home Income', 'cashflow', true, true, 100),
  ('monthly_debt_payments', 'Monthly Debt Payments', 'cashflow', true, true, 110),
  ('monthly_housing', 'Monthly Housing (Rent/Mortgage)', 'cashflow', true, true, 120),
  ('monthly_insurance', 'Monthly Insurance Premiums', 'cashflow', true, true, 130),
  ('monthly_living_expenses', 'Monthly Living Expenses', 'cashflow', true, true, 140),
  ('emergency_fund_balance', 'Emergency Fund Balance', 'cashflow', true, true, 150),
  -- Tax
  ('filing_status', 'Tax Filing Status', 'tax', true, true, 200),
  ('employer_match_captured', 'Capturing Full 401k Match', 'tax', true, true, 210),
  ('tax_advantaged_accounts', 'Tax-Advantaged Accounts', 'tax', true, true, 220),
  -- Household (wizard step 2)
  ('profile_type', 'Profile Type', 'household', true, true, 300),
  ('num_children', 'Number of Children', 'household', true, true, 310),
  ('children_ages', 'Children Ages', 'household', true, false, 320),
  -- Insurance
  ('health_insurance', 'Health Insurance', 'insurance', true, true, 400),
  ('life_insurance', 'Life Insurance', 'insurance', true, false, 410),
  ('disability_insurance', 'Disability Insurance', 'insurance', true, false, 420),
  ('long_term_care_insurance', 'Long-Term Care Insurance', 'insurance', true, false, 430),
  ('no_insurance', 'No Insurance Option', 'insurance', true, false, 440),
  -- Goals
  ('financial_goals', 'Financial Goals', 'goals', true, true, 500),
  -- Retirement (wizard step 3)
  ('years_until_retirement', 'Years Until Retirement', 'retirement', true, true, 600),
  ('desired_retirement_income', 'Desired Retirement Income', 'retirement', true, true, 610),
  ('retirement_balance_total', 'Current Retirement Balance', 'retirement', true, true, 620),
  ('retirement_contribution_monthly', 'Monthly Retirement Contribution', 'retirement', true, true, 630),
  -- Stress (wizard step 4)
  ('stress_money_worry', 'Money Worry Frequency', 'stress', true, true, 700),
  ('stress_emergency_confidence', 'Emergency Expense Confidence', 'stress', true, true, 710),
  ('stress_control_feeling', 'Financial Control Feeling', 'stress', true, true, 720),
  -- Motivation
  ('motivation_text', 'Motivation Statement', 'motivation', true, false, 800),
  ('motivation_images', 'Vision Images', 'motivation', true, false, 810)
ON CONFLICT (field_key) DO NOTHING;
