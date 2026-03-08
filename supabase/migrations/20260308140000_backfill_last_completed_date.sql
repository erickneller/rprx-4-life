-- Backfill last_completed_date for onboarding progress records
-- that have completed_days but null last_completed_date.
--
-- These users completed days before the code was updated to write
-- last_completed_date. Without this value, streak calculation
-- and "come back tomorrow" gating can misbehave.
--
-- Strategy: use the updated_at timestamp (best proxy for when
-- they last completed a day) truncated to date.
-- Only affects rows that actually have completed days.

UPDATE user_onboarding_progress
SET last_completed_date = (updated_at AT TIME ZONE 'UTC')::date::text
WHERE last_completed_date IS NULL
  AND completed_days IS NOT NULL
  AND completed_days != '[]'::jsonb;
