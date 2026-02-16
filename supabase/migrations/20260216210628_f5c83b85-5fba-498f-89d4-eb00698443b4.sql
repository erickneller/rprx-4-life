
ALTER TABLE public.profiles
  ADD COLUMN years_until_retirement integer NULL,
  ADD COLUMN desired_retirement_income numeric NULL,
  ADD COLUMN retirement_balance_total numeric NULL,
  ADD COLUMN retirement_contribution_monthly numeric NULL,
  ADD COLUMN health_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN life_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN disability_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN long_term_care_insurance boolean NOT NULL DEFAULT false;
