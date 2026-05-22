INSERT INTO public.dashboard_card_config (id, display_name, component_key, sort_order, is_visible, default_size, description)
VALUES ('daily-checkin', 'Daily Check-In', 'DailyCheckIn', 5, true, 'full', 'Prompts users to log daily progress on their active strategy.')
ON CONFLICT (id) DO NOTHING;