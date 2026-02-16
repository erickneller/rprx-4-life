
-- 1. Add gamification columns to existing profiles table (rprx_score already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_tier text NOT NULL DEFAULT 'awakening',
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS total_points_earned integer NOT NULL DEFAULT 0;

-- 2. Drop old badges system
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;

-- 3. Create badge_definitions table
CREATE TABLE public.badge_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points integer NOT NULL,
  category text NOT NULL,
  trigger_type text NOT NULL,
  trigger_value jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read badge definitions"
  ON public.badge_definitions FOR SELECT
  TO authenticated
  USING (true);

-- 4. Create user_badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id text NOT NULL REFERENCES public.badge_definitions(id),
  points_awarded integer NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Create user_activity_log table
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_data jsonb,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log their own activity"
  ON public.user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Create strategy_definitions table
CREATE TABLE public.strategy_definitions (
  id text PRIMARY KEY,
  horseman_type text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'moderate',
  estimated_impact text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strategy definitions"
  ON public.strategy_definitions FOR SELECT
  TO authenticated
  USING (true);

-- 7. Create user_active_strategies table
CREATE TABLE public.user_active_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_id text NOT NULL REFERENCES public.strategy_definitions(id),
  status text NOT NULL DEFAULT 'active',
  activated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  UNIQUE (user_id, strategy_id)
);

ALTER TABLE public.user_active_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategies"
  ON public.user_active_strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can activate strategies"
  ON public.user_active_strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON public.user_active_strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON public.user_active_strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Seed badge definitions
INSERT INTO public.badge_definitions (id, name, description, icon, points, category, trigger_type, trigger_value, sort_order, is_active) VALUES
  ('first_step', 'First Step', 'Complete your first Four Horsemen assessment', '🏁', 25, 'milestone', 'assessment_complete', '{"count": 1}', 1, true),
  ('profile_pro', 'Profile Pro', 'Complete all sections of your profile', '📋', 50, 'milestone', 'profile_complete', '{"completeness": 100}', 2, true),
  ('deep_diver', 'Deep Diver', 'Complete your first Deep Dive assessment', '🔍', 50, 'milestone', 'deep_dive_complete', '{"count": 1}', 3, true),
  ('quick_win', 'Quick Win', 'Activate your first RPRx quick-win strategy', '⚡', 75, 'strategy', 'strategy_activated', '{"count": 1, "difficulty": "quick_win"}', 4, true),
  ('pathfinder', 'RPRx Pathfinder', 'Activate 3 RPRx strategies', '🎯', 50, 'strategy', 'strategy_activated', '{"count": 3}', 5, true),
  ('trailblazer', 'RPRx Trailblazer', 'Activate 5 RPRx strategies', '🧠', 75, 'strategy', 'strategy_activated', '{"count": 5}', 6, true),
  ('finisher', 'RPRx Finisher', 'Complete your first activated strategy', '✅', 100, 'strategy', 'strategy_completed', '{"count": 1}', 7, true),
  ('multi_finisher', 'Multi-Finisher', 'Complete 3 RPRx strategies', '🏅', 150, 'strategy', 'strategy_completed', '{"count": 3}', 8, true),
  ('streak_7', '7-Day Streak', 'Log in 7 consecutive days', '🔥', 25, 'streak', 'streak_reached', '{"streak_days": 7}', 9, true),
  ('streak_14', '14-Day Streak', 'Log in 14 consecutive days', '🔥🔥', 40, 'streak', 'streak_reached', '{"streak_days": 14}', 10, true),
  ('streak_30', '30-Day Warrior', 'Log in 30 consecutive days', '🏆', 75, 'streak', 'streak_reached', '{"streak_days": 30}', 11, true),
  ('streak_90', 'RPRx Committed', 'Log in 90 consecutive days', '💪', 150, 'streak', 'streak_reached', '{"streak_days": 90}', 12, true),
  ('tier_reducing', 'Level Up: Reducing', 'Reach the Reducing tier (200+ points)', '🟠', 50, 'engagement', 'tier_reached', '{"tier": "reducing"}', 13, true),
  ('tier_paying', 'Level Up: Paying', 'Reach the Paying tier (400+ points)', '🟡', 50, 'engagement', 'tier_reached', '{"tier": "paying"}', 14, true),
  ('tier_recovering', 'Level Up: Recovering', 'Reach the Recovering tier (600+ points)', '🟢', 50, 'engagement', 'tier_reached', '{"tier": "recovering"}', 15, true),
  ('tier_thriving', 'Level Up: Thriving', 'Reach the Thriving tier (800+ points)', '💎', 100, 'engagement', 'tier_reached', '{"tier": "thriving"}', 16, true),
  ('savings_1k', '$1K Unlocked', 'Your RPRx strategies have unlocked $1,000+ in estimated annual savings', '💰', 100, 'savings', 'savings_milestone', '{"amount": 1000}', 17, true),
  ('savings_5k', '$5K Unlocked', 'Your RPRx strategies have unlocked $5,000+ in estimated annual savings', '🚀', 150, 'savings', 'savings_milestone', '{"amount": 5000}', 18, true),
  ('savings_10k', '$10K Unlocked', 'Your RPRx strategies have unlocked $10,000+ in estimated annual savings', '🌟', 200, 'savings', 'savings_milestone', '{"amount": 10000}', 19, true),
  ('horseman_slayer', 'Horseman Slayer', 'Activate at least one strategy for each of the Four Horsemen', '🐴', 100, 'milestone', 'strategy_activated', '{"all_horsemen": true}', 20, true),
  ('reassessment', 'Growth Mindset', 'Complete a second assessment to track your progress', '📈', 50, 'milestone', 'assessment_complete', '{"count": 2}', 21, true);
