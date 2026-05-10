INSERT INTO public.dashboard_card_config (id, component_key, display_name, description, default_size, is_visible, sort_order)
VALUES ('virtual_advisor', 'VirtualAdvisorCard', 'Virtual Advisor', 'Talk to your virtual advisor without leaving the dashboard', 'full', true, 11)
ON CONFLICT (id) DO NOTHING;