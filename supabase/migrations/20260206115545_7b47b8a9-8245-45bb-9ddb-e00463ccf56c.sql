-- Add cash flow fields to profiles table
ALTER TABLE public.profiles ADD COLUMN monthly_income numeric;
ALTER TABLE public.profiles ADD COLUMN monthly_debt_payments numeric;
ALTER TABLE public.profiles ADD COLUMN monthly_housing numeric;
ALTER TABLE public.profiles ADD COLUMN monthly_insurance numeric;
ALTER TABLE public.profiles ADD COLUMN monthly_living_expenses numeric;