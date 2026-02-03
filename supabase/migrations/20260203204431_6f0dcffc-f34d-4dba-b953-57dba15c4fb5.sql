-- Create enums for debt types and journey status
CREATE TYPE public.debt_type AS ENUM (
  'credit_card',
  'student_loan',
  'auto_loan',
  'mortgage',
  'personal_loan',
  'medical',
  'other'
);

CREATE TYPE public.journey_status AS ENUM (
  'active',
  'completed',
  'paused'
);

CREATE TYPE public.payment_type AS ENUM (
  'payment',
  'balance_update'
);

-- Create debt_journeys table
CREATE TABLE public.debt_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dream_text TEXT,
  dream_image_url TEXT,
  status public.journey_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_debts table
CREATE TABLE public.user_debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.debt_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  debt_type public.debt_type NOT NULL,
  name TEXT NOT NULL,
  original_balance NUMERIC(12, 2) NOT NULL,
  current_balance NUMERIC(12, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  min_payment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_off_at TIMESTAMP WITH TIME ZONE
);

-- Create debt_payments table
CREATE TABLE public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.user_debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_type public.payment_type NOT NULL DEFAULT 'payment',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table (for seeded badge definitions)
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.debt_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for debt_journeys
CREATE POLICY "Users can view their own journeys"
  ON public.debt_journeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journeys"
  ON public.debt_journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journeys"
  ON public.debt_journeys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journeys"
  ON public.debt_journeys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_debts
CREATE POLICY "Users can view their own debts"
  ON public.user_debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debts"
  ON public.user_debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON public.user_debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
  ON public.user_debts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for debt_payments
CREATE POLICY "Users can view their own payments"
  ON public.debt_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.debt_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.debt_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.debt_payments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for badges (read-only for all authenticated users)
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own earned badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value, category) VALUES
  ('First Step', 'Log your first payment', 'footprints', 'payment_count', 1, 'milestone'),
  ('Week Warrior', 'Log payments 2 weeks in a row', 'calendar-check', 'streak_weeks', 2, 'consistency'),
  ('10% Club', 'Pay off 10% of your total debt', 'percent', 'percent_paid', 10, 'progress'),
  ('Quarter Way', 'Pay off 25% of your total debt', 'flag', 'percent_paid', 25, 'progress'),
  ('Halfway Hero', 'Pay off 50% of your total debt', 'trophy', 'percent_paid', 50, 'progress'),
  ('Almost There', 'Pay off 75% of your total debt', 'star', 'percent_paid', 75, 'progress'),
  ('Debt Destroyer', 'Pay off a single debt completely', 'target', 'debt_paid_off', 1, 'milestone'),
  ('Freedom Fighter', 'Complete your entire debt freedom journey', 'crown', 'journey_complete', 1, 'milestone');

-- Create indexes for better query performance
CREATE INDEX idx_debt_journeys_user_id ON public.debt_journeys(user_id);
CREATE INDEX idx_user_debts_journey_id ON public.user_debts(journey_id);
CREATE INDEX idx_user_debts_user_id ON public.user_debts(user_id);
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);