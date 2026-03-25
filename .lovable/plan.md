

# Fix: Auto-Advance Stale Closure Bug

## Root Cause
The `useCallback` dependency chain creates a stale closure when used with `setTimeout`:

1. User selects answer → `handleCoreResponse` runs
2. `setResponse` triggers React state update + re-render
3. `scheduleAutoAdvance()` sets a 400ms timeout capturing the **current** `handleNext`
4. React re-renders with new state, creating a **new** `handleNext` with updated deps
5. 400ms later, timeout fires the **old** `handleNext` → calls **old** `goToNext` which has a stale `state.currentStep` in its condition check → may silently fail

This is not related to the user account — it affects all users.

## Fix

### `src/components/assessment/AssessmentWizard.tsx`
Use a `useRef` to always hold the latest `handleNext`, so the timeout always calls the current version:

- Add `const handleNextRef = useRef(handleNext)` and keep it synced with `useEffect(() => { handleNextRef.current = handleNext })`
- Change `scheduleAutoAdvance` to call `handleNextRef.current()` instead of `handleNext` directly
- Remove `handleNext` from `scheduleAutoAdvance`'s dependency array (it reads from the ref instead)

This is a standard React pattern for avoiding stale closures in timers.

## Single file change
- `src/components/assessment/AssessmentWizard.tsx` — ~5 lines changed

