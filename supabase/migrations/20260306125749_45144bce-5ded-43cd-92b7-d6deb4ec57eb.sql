-- Fix dashboard card sort_order to match PRD order:
-- 1. Daily Journey, 2. Money Leak, 3. Current Focus, 4. RPRx Score, 5. Cash Flow, 6. My Strategies, 7. Recent Achievements
-- Keep Motivation and LeakBreakdown but adjust order

UPDATE dashboard_card_config SET sort_order = 1 WHERE component_key = 'OnboardingCard';
UPDATE dashboard_card_config SET sort_order = 2 WHERE component_key = 'MoneyLeakCard';
UPDATE dashboard_card_config SET sort_order = 3 WHERE component_key = 'CurrentFocusCard';
UPDATE dashboard_card_config SET sort_order = 4 WHERE component_key = 'GamificationScoreCard';
UPDATE dashboard_card_config SET sort_order = 5 WHERE component_key = 'CashFlowStatusCard';
UPDATE dashboard_card_config SET sort_order = 6 WHERE component_key = 'MyStrategiesCard';
UPDATE dashboard_card_config SET sort_order = 7 WHERE component_key = 'RecentBadges';
UPDATE dashboard_card_config SET sort_order = 8 WHERE component_key = 'MotivationCard';
UPDATE dashboard_card_config SET sort_order = 9 WHERE component_key = 'LeakBreakdownList';