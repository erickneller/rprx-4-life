INSERT INTO public.dashboard_card_config (id, component_key, display_name, description, sort_order, is_visible, default_size)
VALUES ('advisor-cta', 'AdvisorCTACard', 'Speak with an Advisor', 'CTA card linking to the RPRx advisor booking page', 10, true, 'full')
ON CONFLICT (id) DO NOTHING;