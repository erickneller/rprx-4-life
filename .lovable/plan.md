

# Fix: Users with null `last_completed_date` permanently stuck

## Root Cause

The user completed days 1 and 2 **before** the `last_completed_date` column was added. Their `last_completed_date` is `null`. The current logic in `getAvailableDay()` treats null as today:

```
const lastDate = progress.last_completed_date || today;
```

This means every time the user loads the dashboard, `today === lastDate` evaluates to true, returning `{ currentDay: 2, isLocked: true }` forever. The next day never unlocks.

## Fix

In `src/lib/onboardingEngine.ts`, line 173 — change the null fallback logic:

- If `last_completed_date` is null **and** the user has completed days, treat it as **yesterday** (so the next day unlocks immediately)
- If `last_completed_date` is null **and** no days completed, this path is never reached (the early return on line 166-168 handles it)

So the fix is simply: when `last_completed_date` is null and there are completed days, use yesterday's date instead of today.

```text
// Before:
const lastDate = progress.last_completed_date || today;

// After:
let lastDate: string;
if (progress.last_completed_date) {
  lastDate = progress.last_completed_date;
} else {
  // Existing users who completed days before this column existed —
  // treat as yesterday so they can advance immediately
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  lastDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}
```

This is safe because:
- The null + zero-completed-days case is already handled by the early return on line 166
- Once the user completes any day going forward, `last_completed_date` gets written and null handling is no longer relevant

## Files Modified

- `src/lib/onboardingEngine.ts` — fix null fallback in `getAvailableDay()` (line 173)

