
CREATE TABLE public.sidebar_nav_config (
  id text PRIMARY KEY,
  label text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sidebar_nav_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nav config" ON public.sidebar_nav_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage nav config" ON public.sidebar_nav_config
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed rows
INSERT INTO public.sidebar_nav_config (id, label, sort_order) VALUES
  ('item:dashboard', 'Dashboard', 0),
  ('section:financial_stability', 'Financial Stability', 10),
  ('item:debt_eliminator', 'Debt Elimination System', 11),
  ('item:cash_flow_control', 'Cash Flow Control System', 12),
  ('item:tax_efficiency', 'Tax Efficiency System', 13),
  ('item:income_optimization', 'Income Optimization Strategy', 14),
  ('section:financial_growth', 'Financial Growth', 20),
  ('item:financial_freedom', 'Financial Freedom Strategy', 21),
  ('item:education_advantage', 'Education Advantage Framework', 22),
  ('item:strategic_wealth', 'Strategic Wealth Moves', 23),
  ('item:income_expansion', 'Income Expansion Strategy', 24),
  ('section:financial_protection', 'Financial Protection', 30),
  ('item:protection_alignment', 'Protection Alignment Strategy', 31),
  ('item:health_cost', 'Health Cost Strategy', 32),
  ('item:legacy_continuity', 'Legacy Continuity System', 33),
  ('item:life_transition', 'Life Transition Strategy', 34),
  ('item:strategy_assistant', 'Strategy Assistant', 40),
  ('item:my_assessments', 'My Assessments', 41),
  ('item:my_plans', 'My Plans', 42),
  ('item:my_profile', 'My Profile', 43),
  ('item:advisor_link', 'Speak with an Advisor', 50);
