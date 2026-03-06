

# Are Daily Onboarding Tasks Adding XP?

## Current Behavior

**Partially.** The `completeDay()` function in `onboardingEngine.ts` does two things with XP:

1. Increments `user_onboarding_progress.total_points_earned` (line 246) -- this is an onboarding-local counter
2. Increments `profiles.total_points_earned` (lines 281-293) -- this is the global XP counter

So the raw points number does go up. **However**, it has two gaps:

### What's Missing

1. **No activity log entry** -- `completeDay` never inserts into `user_activity_log`, so the activity doesn't show up in any activity history and the admin analytics can't track it.

2. **No badge check via gamification** -- `completeDay` calls its own `checkOnboardingBadges()` for milestone badges, but it never calls `logActivity()` from the gamification hook. This means:
   - No XP-earned toast appears (the `showPointsEarnedToast` is never triggered)
   - No achievement toast for badges that might be triggered by an `onboarding_day_complete` activity type
   - The RPRx score is never recalculated after completion (`recalculateAndPersistScore` is never called)

3. **No XP config lookup** -- The XP awarded is the static `content.points_reward` value from the `onboarding_content` table, not from the `activity_xp_config` table. So if an admin changes the XP value for onboarding completions in the admin panel, it won't take effect.

### Summary

The points **do** accumulate on the profile, but silently -- no toasts, no activity log, no config-driven XP, and no RPRx score recalculation.

## Recommended Fix

Integrate the onboarding completion with the gamification system by calling `logActivity('onboarding_day_complete')` from the `OnboardingCard` component after `completeToday()` succeeds. This would:

- Log the activity to `user_activity_log`
- Use config-driven XP from `activity_xp_config`
- Show XP-earned and badge toasts
- Trigger RPRx score recalculation

### Files to Modify

1. **`src/components/onboarding/OnboardingCard.tsx`** -- Import `useGamification`, call `logActivity('onboarding_day_complete', { day: currentDay })` after each successful completion (in `handleAction`, `handleQuizComplete`, `handleReflectionComplete`, and the Day 1 CTA flow).

2. **`src/lib/onboardingEngine.ts`** -- Remove the duplicate `profiles.total_points_earned` increment (lines 281-293) since `logActivity` already handles that. Keep the `user_onboarding_progress.total_points_earned` increment as the onboarding-local counter.

3. **Database: `activity_xp_config`** -- Ensure an `onboarding_day_complete` row exists with the desired base XP (e.g., 5 or 10). Add via migration if missing.

