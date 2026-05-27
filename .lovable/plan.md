## Root cause

`src/pages/Join.tsx` uses `useFirstLoginFlow()`, `useProfile()`, and `useAssessmentHistory()` to compute the post-signup destination, but never waits for those queries to finish.

- `useFirstLoginFlow` returns `DEFAULT_FIRST_LOGIN_FLOW = 'profile_then_assessment'` while loading.
- `useProfile().isProfileComplete` is `false` until the new profile loads.

With that combination, `getFirstDestination()` resolves to `/wizard` even when the admin preset is actually `dashboard_silent`. The user gets pushed to the Profile Wizard ("Your Financial Snapshot") instead of the dashboard.

## Fix — `src/pages/Join.tsx`

1. Pull loading flags from each hook:
   - `useProfile()` → `isLoading: profileLoading`
   - `useAssessmentHistory()` → `isLoading: assessmentsLoading, isFetched: assessmentsFetched`
   - `useFirstLoginFlow()` → `isLoading: presetLoading`

2. **Auto-join effect (already-logged-in path):** add `profileLoading || assessmentsLoading || !assessmentsFetched || presetLoading` to the early-return guard, and include those flags in the dependency array. Only navigate once the preset/profile/assessments queries have resolved.

3. **Signup handler:** after `supabase.auth.signUp()` succeeds, do **not** navigate immediately. Set a `pendingNavigate = true` flag and let a new effect handle the redirect once:
   - `user` is populated (auto-signin completed), and
   - `presetLoading`, `profileLoading`, `assessmentsLoading` are all false.

   That effect calls `joinByToken(token)` (if not already joined) and then `getFirstDestination(...)` with the now-correct values, falling back to `/dashboard`.

4. Keep the toast on signup success; show a "Setting things up…" spinner while `pendingNavigate` is true so the form doesn't sit visible during the wait.

## Out of scope
- No change to `WizardGuard`, `Index.tsx`, or `firstLoginFlow.ts`.
- No change to feature-flag schema.
