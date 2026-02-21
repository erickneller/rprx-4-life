
-- Create activity_xp_config table
CREATE TABLE public.activity_xp_config (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  base_xp integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_xp_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read activity xp config"
ON public.activity_xp_config FOR SELECT
TO authenticated
USING (true);

-- Admins can insert
CREATE POLICY "Admins can insert activity xp config"
ON public.activity_xp_config FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update activity xp config"
ON public.activity_xp_config FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete activity xp config"
ON public.activity_xp_config FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_activity_xp_config_updated_at
BEFORE UPDATE ON public.activity_xp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.activity_xp_config (id, display_name, description, base_xp, sort_order) VALUES
  ('login', 'Daily Login', 'Awarded once per day when user logs in', 5, 1),
  ('assessment_complete', 'Assessment Completed', 'Completing the full financial assessment', 25, 2),
  ('deep_dive_complete', 'Deep Dive Completed', 'Completing a horseman deep-dive questionnaire', 75, 3),
  ('strategy_activated', 'Strategy Activated', 'Activating a recommended strategy', 50, 4),
  ('strategy_completed', 'Strategy Completed', 'Marking a strategy as complete', 30, 5),
  ('profile_updated', 'Profile Updated', 'Updating profile information', 10, 6),
  ('onboarding_day_complete', 'Onboarding Day Completed', 'Completing a day in the 30-day onboarding journey', 10, 7),
  ('plan_step_completed', 'Plan Step Completed', 'Completing a step in a saved plan', 15, 8);
