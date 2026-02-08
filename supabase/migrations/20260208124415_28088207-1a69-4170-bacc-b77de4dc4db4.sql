-- Add focus debt tracking to journeys
ALTER TABLE public.debt_journeys 
  ADD COLUMN focus_debt_id uuid REFERENCES public.user_debts(id) ON DELETE SET NULL,
  ADD COLUMN monthly_surplus numeric;