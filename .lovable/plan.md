

# Defensive Hardening for Onboarding Day Completion

## Assessment Summary

After auditing all code paths, the three reported concerns are either already absent or already fixed:

| Concern | Status | Details |
|---------|--------|---------|
| Plan generation triggering completeDay | Not present | `autoGenerateStrategy` and `useDayOneCTA` never call completion functions |
| Day 2 auto-completing on arrival | Fixed previously | The `localCompleted` reset `useEffect` on `currentDay` change handles this |
| Day 2 showing all horsemen | Not present | `getOnboardingContent()` already filters by horseman then falls back to universal |

## Proposed Defensive Changes

Even though the bugs aren't currently present, the user's spec requests explicit safeguards and documentation to prevent future regressions. The following changes add guardrails without altering functionality.

### 1. Add protective comment to `completeDay()` in `onboardingEngine.ts`

Add the requested comment above the `completeDay` function:

```typescript
// Only call this from explicit user action -- never from background events, plan generation, or page load.
export async function completeDay(...) { ... }
```

### 2. Add duplicate-completion guard in `completeDay()`

Early-return if the day is already in `completed_days`:

```typescript
const completedDays = [...(progress.completed_days as number[])];
if (completedDays.includes(dayNumber)) return; // Already completed -- no-op
```

This prevents double-completion if the function is accidentally called twice for the same day.

### 3. Add guard in `useOnboarding` mutation

Add a check in the `completeToday` mutation to bail out if the day is already completed:

```typescript
mutationFn: async (response?: unknown) => {
  if (!user || !availableDay || !todayContent) throw new Error('No content');
  // Guard: never re-complete a day
  if (progress?.completed_days.includes(availableDay)) return;
  await completeDay(user.id, availableDay, todayContent, response);
},
```

### 4. Confirm `autoGenerateStrategy` has no completion side effects

Add a comment in `autoStrategyGenerator.ts` at the end of the function to make the boundary explicit:

```typescript
// NOTE: This function ONLY generates and saves the plan.
// Day completion is handled separately by explicit user action in OnboardingCard.
return plan;
```

### Files Modified

- `src/lib/onboardingEngine.ts` -- add comment and duplicate guard
- `src/hooks/useOnboarding.ts` -- add already-completed guard in mutation
- `src/lib/autoStrategyGenerator.ts` -- add clarifying comment

No functional behavior changes. These are purely defensive safeguards and documentation.

