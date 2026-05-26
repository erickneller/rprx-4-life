INSERT INTO public.sidebar_nav_config (id, label, visible, sort_order, is_course, kind, parent_id, icon, url, link_type, is_system, required_tier)
VALUES
  ('section:calculators', 'Calculators', true, 150, false, 'section', NULL, NULL, NULL, 'route', false, 'free'),
  ('item:equity_recapture_calculator', 'Equity Recapture Calculator', true, 160, false, 'item', 'section:calculators', 'Calculator', '/calculators/equity-recapture', 'route', false, 'partner')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  url = EXCLUDED.url,
  link_type = EXCLUDED.link_type,
  parent_id = EXCLUDED.parent_id,
  icon = EXCLUDED.icon,
  required_tier = EXCLUDED.required_tier,
  visible = true,
  updated_at = now();