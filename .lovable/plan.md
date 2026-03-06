

# Fix `onboarding_completed` flag — flip at the right moment

## Problem
`profiles.onboarding_completed` is `false` for all users. It controls whether `/profile` shows the wizard or the edit view, but it never gets set to `true` at the correct moment.

## Trigger Condition
Set `onboarding_completed = true` when ALL three are true:
1. `user_assessments.completed_at IS NOT NULL` (assessment done)
2. `saved_plans` row exists with `is_focus = true` (focus plan set)
3. `user_onboarding_progress.current_day >= 2` (engaged past Day 1)

## Changes

### 1. New utility: `src/lib/onboardingCompleteCheck.ts`
Create a standalone async function `checkAndFlipOnboardingComplete(userId)` that:
- Queries the three conditions above
- If all met and profile `onboarding_completed` is still `false`, updates it to `true`
- Invalidates the `profile` query cache after flipping
- Returns whether the flag was flipped

### 2. Place 1 — Dashboard load (`src/components/dashboard/DashboardContent.tsx`)
- Import `checkAndFlipOnboardingComplete` and call it in a `useEffect` on mount when `profile` is loaded and `profile.onboarding_completed === false`
- Fire-and-forget (no UI change), invalidate profile query on success

### 3. Place 2 — After Day 1 completion (`src/components/onboarding/OnboardingCard.tsx`)
- After `completeToday()` succeeds for Day 1 (in the Day 1 CTA handler and any `complete_step` action on day 1), call `checkAndFlipOnboardingComplete`
- This catches users who complete Day 1 after already having an assessment + focus plan

### 4. Profile routing (`src/pages/Profile.tsx`)
- The profile page already checks `profile.onboarding_completed` to decide wizard vs edit view. No routing change needed — the flag flip handles it. Confirm the existing logic in `Profile.tsx` and `WizardGuard.tsx` uses this flag correctly. Based on the memory notes, this is already the case.

## Files Modified
- **New**: `src/lib/onboardingCompleteCheck.ts`
- **Edit**: `src/components/dashboard/DashboardContent.tsx` — add useEffect to run check on mount
- **Edit**: `src/components/onboarding/OnboardingCard.tsx` — call check after Day 1 completion

