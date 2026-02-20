
-- Create dashboard card configuration table
CREATE TABLE public.dashboard_card_config (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  component_key text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  default_size text NOT NULL DEFAULT 'full',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_card_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read dashboard config"
  ON public.dashboard_card_config FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert dashboard config"
  ON public.dashboard_card_config FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update dashboard config"
  ON public.dashboard_card_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete dashboard config"
  ON public.dashboard_card_config FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_dashboard_card_config_updated_at
  BEFORE UPDATE ON public.dashboard_card_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.dashboard_card_config (id, display_name, component_key, sort_order, is_visible, default_size, description) VALUES
  ('motivation', 'My Motivation', 'MotivationCard', 1, true, 'full', 'User motivation quote and vision board images'),
  ('money_leak', 'Money Leak Estimator', 'MoneyLeakCard', 2, true, 'full', 'Shows estimated annual money left on the table and recovery progress'),
  ('plan_impact', 'Plan Impact Breakdown', 'LeakBreakdownList', 3, true, 'full', 'Shows impact breakdown of active plans by horseman'),
  ('rprx_score', 'RPRx Score', 'GamificationScoreCard', 4, true, 'full', 'Financial wellness score with 5-pillar breakdown and grade'),
  ('current_focus', 'My Current Focus', 'CurrentFocusCard', 5, true, 'full', 'Shows the focused plan with progress and continue button'),
  ('cash_flow', 'Cash Flow Snapshot', 'CashFlowStatusCard', 6, true, 'full', 'Monthly surplus/deficit and key financial metrics'),
  ('my_strategies', 'My Strategies', 'MyStrategiesCard', 7, true, 'full', 'Active and completed strategies with points earned'),
  ('achievements', 'Recent Achievements', 'RecentBadges', 8, true, 'full', 'Latest badges and achievements earned');
