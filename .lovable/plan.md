Root cause found: `/join` is reading the global `first_login_flow` before the visitor is authenticated. Because the `feature_flags` RLS policy is only for authenticated users, the unauthenticated lookup sees no flag and React Query caches the fallback onboarding preset. After signup, the same static cache key is reused, so the join flow can still compute `/wizard` even though the database flag is `dashboard_silent` and Tester3 is `partner`.

Plan:

1. Fix the database visibility hole for the onboarding flag
   - Add a Supabase migration that allows anonymous visitors to read only the public onboarding flag needed by `/join`.
   - Keep admin-only write access unchanged.
   - Re-grant read access explicitly so the Data API cannot silently hide the flag.

2. Fix the client cache poisoning path
   - Update `useFirstLoginFlow` so its React Query key is auth-state aware instead of shared between anonymous and signed-in users.
   - Wait for auth loading to settle before resolving the flag.
   - Keep `/join` from reusing a pre-signup fallback value after the user is created.

3. Strengthen the direct wizard guard
   - Ensure direct `/wizard` access redirects to `/dashboard` when the effective global flow is dashboard-only.
   - Keep legitimate wizard flows working when a company/global preset intentionally requires wizard.

4. Add regression coverage
   - Add/update tests proving:
     - global `dashboard_silent` resolves to `/dashboard` for incomplete company users with no company override;
     - direct `/wizard` is blocked under dashboard-only flow;
     - the default forced-wizard flow still works when configured.

5. Verification after implementation
   - Re-query Tester3 and `first_login_flow` to confirm the DB state.
   - Run the targeted onboarding/WizardGuard tests.
   - After publish, retest the Tester3 invite from a fresh incognito session and confirm the first post-signup route is `/dashboard`, not `/wizard`.