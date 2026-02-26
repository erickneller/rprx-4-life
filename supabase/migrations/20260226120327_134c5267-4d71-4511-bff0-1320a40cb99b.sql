
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  banned_until timestamp with time zone,
  raw_user_meta_data jsonb,
  full_name text,
  phone text,
  monthly_income numeric,
  monthly_debt_payments numeric,
  monthly_housing numeric,
  monthly_insurance numeric,
  monthly_living_expenses numeric,
  emergency_fund_balance numeric,
  filing_status text,
  financial_goals text[],
  onboarding_completed boolean,
  rprx_score_total numeric,
  current_tier text,
  total_points_earned integer,
  current_streak integer,
  health_insurance boolean,
  life_insurance boolean,
  disability_insurance boolean,
  long_term_care_insurance boolean,
  no_insurance boolean,
  stress_money_worry text,
  stress_emergency_confidence text,
  stress_control_feeling text,
  rprx_grade text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    au.banned_until,
    au.raw_user_meta_data,
    p.full_name,
    p.phone,
    p.monthly_income,
    p.monthly_debt_payments,
    p.monthly_housing,
    p.monthly_insurance,
    p.monthly_living_expenses,
    p.emergency_fund_balance,
    p.filing_status,
    p.financial_goals,
    p.onboarding_completed,
    p.rprx_score_total,
    p.current_tier,
    p.total_points_earned,
    p.current_streak,
    p.health_insurance,
    p.life_insurance,
    p.disability_insurance,
    p.long_term_care_insurance,
    p.no_insurance,
    p.stress_money_worry,
    p.stress_emergency_confidence,
    p.stress_control_feeling,
    p.rprx_grade
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC
$$;
