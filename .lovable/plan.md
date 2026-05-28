# Fix: cold-user global "dashboard" must beat legacy incomplete-profile checks

## Problem
Cold users (no company) with the global onboarding preset set to a dashboard option are still being routed to `/wizard`. The path resolver returns `/dashboard` correctly, but legacy "incomplete profile" branches in `Index.tsx` and the forced redirect inside `WizardGuard.tsx` still funnel users to the wizard before/after the resolver runs.

## Required behavior for first-login / incomplete users
1. Company override valid → company path
2. Else if global normalizes to `/dashboard` → force `/dashboard` (no wizard fallback allowed)
3. Else → `/wizard`

Phone interstitial (`/complete-phone`) stays unchanged.

## Changes (3 files only)

### 1. `src/pages/Index.tsx`
- After loading guards + phone check, compute the resolved onboarding route from `resolveOnboardingRoute({...})`.
- Add explicit boolean:
  ```ts
  const forceDashboardFromGlobal = !companyOverrideEnabled && globalPath === '/dashboard';
  ```
- New ordering of decisions (cold-user branch):
  1. If `profile.onboarding_completed || isProfileComplete` → `/dashboard`
  2. Else if `forceDashboardFromGlobal` → `/dashboard` (skip the legacy `hasAssessments → /profile` and resolver-fallback paths)
  3. Else if `hasAssessments` → `/profile`
  4. Else → resolver `path`
- Log payload on the redirect decision:
  ```
  [onboarding-route] {
    source: 'index',
    isCompanyUser, companyOverrideEnabled, companyOverridePath,
    globalRaw, globalNormalized: globalPath,
    forceDashboardFromGlobal, reason, finalRedirectPath
  }
  ```

### 2. `src/components/auth/WizardGuard.tsx`
- Compute the same `forceDashboardFromGlobal` boolean from the same hooks already used.
- When `forceDashboardFromGlobal` is true:
  - Treat `/dashboard` as the resolved onboarding path (so `Navigate to={onboardingPath}` and banner `<Link to={onboardingPath}>` both target `/dashboard`).
  - Suppress the forced wizard redirect: skip the `shouldGuardRedirect(effectivePreset) && !onboarding_completed && !isProfileComplete` branch entirely in this case (no wizard-first override).
- Banner "Continue →" link uses the final resolved path (already does, but reaffirmed via the override).
- Log payload on each redirect/banner decision with `source: 'guard'` and the same fields as Index.

### 3. (Optional) `src/lib/onboardingRoute.ts`
- No signature change. If helpful, export a tiny helper `isForcedDashboard(globalPath, companyOverrideEnabled)` returning the same boolean so Index and Guard share one source of truth. Otherwise inline the one-liner in both files. Decision: inline (smaller diff, matches "do not refactor unrelated code").

## Out of scope
- `useFirstLoginFlow.ts` normalization is already correct (`'dashboard' | 'dashboard_silent' | 'dashboard_nudge' → '/dashboard'`); not touching it.
- Phone-capture redirect, company override path, post-wizard destination — unchanged.
- No test file edits required, but I will spot-check `src/lib/__tests__/onboardingRoute.test.ts` still passes (no API change).

## Verification I will return
1. `git diff` for `src/pages/Index.tsx` and `src/components/auth/WizardGuard.tsx`.
2. One runtime console log sample for a cold user with global `dashboard_silent` showing `finalRedirectPath: '/dashboard'` and `forceDashboardFromGlobal: true`.
3. Output of:
   ```
   rg -n '"/wizard"|to="/wizard"|Navigate to="/wizard"' src/pages/Index.tsx src/components/auth/WizardGuard.tsx
   ```
   (expected: no matches in decision points / banner links).
