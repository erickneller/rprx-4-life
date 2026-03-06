INSERT INTO activity_xp_config (id, display_name, description, base_xp, sort_order, is_active)
VALUES ('daily_checkin', 'Daily Strategy Check-In', 'One-tap daily check-in on strategy progress', 5, 10, true)
ON CONFLICT (id) DO NOTHING;