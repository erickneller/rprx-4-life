

# Calendar-Day Unlock Logic for Onboarding

## Summary

Replace the current `onboarding_start_date`-based day gating with a `last_completed_date`-based calendar unlock system. The column already exists in the DB (no migration needed). Three files change.

## Changes

### 1. `src/lib/onboardingEngine.ts`

**A. Update `OnboardingProgress` type** — add `last_completed_date: string | null`

**B. Update `completeDay()`** — write `last_completed_date: today's local date` alongside existing updates

**C. Replace `getAvailableDay()`** with new calendar-based logic:

```text
Input: progress (with completed_days, last_completed_date)
Output: { currentDay: number, isLocked: boolean }

lastCompleted = max(progress.completed_days) or 0
lastDate = progress.last_completed_date (treat null as today's date)
today = local date string (YYYY-MM-DD)

if lastCompleted === 0 → return { currentDay: 1, isLocked: false }
if today > lastDate → return { currentDay: lastCompleted + 1, isLocked: false }
if today === lastDate → return { currentDay: lastCompleted, isLocked: true }
// Edge case: today < lastDate (clock skew) → treat as locked
```

**D. Add `getNextDayContent()` helper** — fetches the title only of day N+1 for the locked teaser. Can reuse `getOnboardingContent()` but only return the title.

### 2. `src/hooks/useOnboarding.ts`

**A. Update progress query** — include `last_completed_date` in the mapped type

**B. Use new `getAvailableDay` return shape** — destructure `{ currentDay, isLocked }` instead of just a number

**C. Fetch next day content** — when `isLocked === true`, also fetch day N+1 content title for the teaser card

**D. Expose new fields** — add `isLocked`, `nextDayTitle`, `nextDayNumber` to the return object

### 3. `src/components/onboarding/OnboardingCard.tsx`

**A. Handle locked state** — when `isLocked && isDone`, show a different overlay:
- Green checkmark + "Day N Complete!"
- Below: locked card showing day N+1 number, title, and "🔒 Unlocks tomorrow"
- No body text, no CTA button

**B. When `isLocked && !isDone`** — this shouldn't happen (locked means today's day was already completed), but guard against it by showing the completed overlay

**C. Remove the generic "Come back tomorrow for Day X" text** — replace with the structured teaser card described above

## Data flow

```text
completeDay(n) → writes last_completed_date = today
                                ↓
Next app load → getAvailableDay reads last_completed_date
                                ↓
  today > last_completed_date? → unlock day n+1, render active
  today === last_completed_date? → stay locked, show teaser
```

## Edge cases

- `last_completed_date = null` (existing users): treat as today → locked state, which forces them to wait one calendar day. Per user's instruction: "treat null as today's date for unlock calculation."
- Day 30 completed: journey status = 'completed', card doesn't render at all (existing behavior)
- Multiple days missed: user catches up one day at a time (each completion locks until next calendar day)

## Files Modified

- `src/lib/onboardingEngine.ts` — new unlock logic, write `last_completed_date`
- `src/hooks/useOnboarding.ts` — expose locked state and next-day teaser
- `src/components/onboarding/OnboardingCard.tsx` — locked teaser UI

