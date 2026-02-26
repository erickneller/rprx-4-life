

# Fix: Day 2 Falsely Showing as Complete

## Root Cause

In `OnboardingCard.tsx`, a `localCompleted` state variable provides optimistic UI feedback after completing a day. When Day 1 is completed:

1. `localCompleted` is set to `true`
2. Query invalidation fires, `progress.completed_days` now includes Day 1
3. `getAvailableDay()` returns Day 2, so `currentDay` becomes 2
4. The component re-renders with `currentDay = 2`, but `localCompleted` is still `true`
5. The overlay shows "Day 2 Complete!" -- even though Day 2 was never completed

## Fix

**File: `src/components/onboarding/OnboardingCard.tsx`**

Add a `useEffect` that resets `localCompleted` to `false` whenever `currentDay` changes. This way, the optimistic overlay only applies to the day that was actually just completed, and clears when the component transitions to the next day.

```typescript
useEffect(() => {
  setLocalCompleted(false);
}, [currentDay]);
```

This is a one-line fix (plus the `useEffect` import, which is already available via React). No other files need to change.

