-- Extend sidebar_nav_config with full schema
ALTER TABLE public.sidebar_nav_config
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'item',
  ADD COLUMN IF NOT EXISTS parent_id text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'route',
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Seed sections
INSERT INTO public.sidebar_nav_config (id, label, kind, parent_id, icon, url, link_type, visible, sort_order, is_system, is_course)
VALUES
  ('section:financial_stability', 'Financial Stability', 'section', NULL, NULL, NULL, 'route', true, 100, true, false),
  ('section:financial_growth', 'Financial Growth', 'section', NULL, NULL, NULL, 'route', true, 200, true, false),
  ('section:financial_protection', 'Financial Protection', 'section', NULL, NULL, NULL, 'route', true, 300, true, false),
  ('section:resources', 'Resources', 'section', NULL, NULL, NULL, 'route', true, 400, true, false)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, kind = EXCLUDED.kind, parent_id = EXCLUDED.parent_id,
  is_system = true, sort_order = EXCLUDED.sort_order;

-- Seed items (preserve existing IDs/visibility)
INSERT INTO public.sidebar_nav_config (id, label, kind, parent_id, icon, url, link_type, visible, sort_order, is_system, is_course) VALUES
  ('item:dashboard', 'Dashboard', 'item', NULL, 'LayoutDashboard', '/dashboard', 'route', true, 10, true, false),
  ('item:debt_eliminator', 'Debt Elimination System', 'item', 'section:financial_stability', 'Target', '/debt-eliminator', 'route', true, 110, true, false),
  ('item:cash_flow_control', 'Cash Flow Control System', 'item', 'section:financial_stability', 'Wallet', '#', 'coming_soon', true, 120, true, false),
  ('item:tax_efficiency', 'Tax Efficiency System', 'item', 'section:financial_stability', 'Receipt', '#', 'coming_soon', true, 130, true, false),
  ('item:income_optimization', 'Income Optimization Strategy', 'item', 'section:financial_stability', 'BadgeDollarSign', '#', 'coming_soon', true, 140, true, false),
  ('item:financial_freedom', 'Financial Freedom Strategy', 'item', 'section:financial_growth', 'TrendingUp', '#', 'coming_soon', true, 210, true, false),
  ('item:education_advantage', 'Education Advantage Framework', 'item', 'section:financial_growth', 'GraduationCap', '#', 'coming_soon', true, 220, true, false),
  ('item:strategic_wealth', 'Strategic Wealth Moves', 'item', 'section:financial_growth', 'Rocket', '#', 'coming_soon', true, 230, true, false),
  ('item:income_expansion', 'Income Expansion Strategy', 'item', 'section:financial_growth', 'DollarSign', '#', 'coming_soon', true, 240, true, false),
  ('item:protection_alignment', 'Protection Alignment Strategy', 'item', 'section:financial_protection', 'ShieldCheck', '#', 'coming_soon', true, 310, true, false),
  ('item:health_cost', 'Health Cost Strategy', 'item', 'section:financial_protection', 'HeartPulse', '#', 'coming_soon', true, 320, true, false),
  ('item:legacy_continuity', 'Legacy Continuity System', 'item', 'section:financial_protection', 'Landmark', '#', 'coming_soon', true, 330, true, false),
  ('item:life_transition', 'Life Transition Strategy', 'item', 'section:financial_protection', 'RefreshCw', '#', 'coming_soon', true, 340, true, false),
  ('item:strategy_assistant', 'Strategy Assistant', 'item', 'section:resources', 'MessageSquare', '/strategy-assistant', 'route', true, 410, true, false),
  ('item:my_assessments', 'My Assessments', 'item', 'section:resources', 'ClipboardList', '/assessments', 'route', true, 420, true, false),
  ('item:my_plans', 'My Plans', 'item', 'section:resources', 'FileText', '/plans', 'route', true, 430, true, false),
  ('item:rprx_partners', 'RPRx Partners', 'item', 'section:resources', 'Handshake', '/partners', 'route', true, 440, true, false),
  ('library', 'RPRx Library', 'item', 'section:resources', 'BookOpen', '/library', 'route', true, 450, true, false),
  ('item:my_profile', 'My Profile', 'item', 'section:resources', 'User', '/profile', 'route', true, 460, true, false)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, kind = EXCLUDED.kind, parent_id = EXCLUDED.parent_id,
  icon = EXCLUDED.icon, url = EXCLUDED.url,
  link_type = CASE WHEN public.sidebar_nav_config.is_course THEN 'course' ELSE EXCLUDED.link_type END,
  is_system = true, sort_order = EXCLUDED.sort_order;