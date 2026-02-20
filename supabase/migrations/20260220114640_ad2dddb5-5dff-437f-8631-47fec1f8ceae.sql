
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS estimated_annual_leak_low numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_annual_leak_high numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_annual_leak_recovered numeric DEFAULT 0;
