# Fix: unify all first-login routing through one adapter

## Root cause (live, not theoretical)
Two signup entry points still bypass the centralized resolver:

1. `src/pages/Auth.tsx` line 129 — email/password signup with immediate session
   hard-codes `navigate('/wizard', { replace: true })`.
2. `src/pages/Join.tsx` — company-invite signup uses the older
   `resolveOnboardingRoute` from `src/lib/firstLoginFlow.ts`, which can return
   `/wizard` for incomplete profiles regardless of what global/company is set to.

So even after Index.tsx + WizardGuard.tsx were fixed, new logins from either of
these two paths still land on `/wizard`.

Additional constraint from latest message: **no parallel routing logic** —
Auth, Join, Index, and WizardGuard must all call the same utility.

## The fix (one adapter, 4 callers)

### 1. `src/lib/onboardingRoute.ts` — single source of truth
Add `resolveFinalOnboardingPath()` that returns `{ path, reason }` with this
priority (same order as Index.tsx today, just centralized):

1. `onboardingCompleted || isProfileComplete` → `/dashboard` (`profile_complete`)
2. `companyOverrideEnabled && companyOverridePath` → that path (`company_override`)
3. `!companyOverrideEnabled && globalPath === '/dashboard'` → `/dashboard` (`force_dashboard_global`)
4. `hasAssessments` → `/profile` (`has_assessments_profile`)
5. `globalPath` set → that path (`global_default`)
6. fallback → `/wizard` (`fallback_wizard`)

Keep existing `resolveOnboardingRoute()` (low-level company-vs-global picker)
for tests and for the WizardGuard's allowed-path check. The new function
composes it with the profile-state branches.

### 2. `src/pages/Index.tsx`
Replace the inline if/else chain with a single call to
`resolveFinalOnboardingPath({...})`. Keep the existing
`[onboarding-route] source: 'index'` debug log (now includes `reason`).

### 3. `src/components/auth/WizardGuard.tsx`
Replace the inline `forceDashboardFromGlobal` boolean + `resolveOnboardingRoute`
call with `resolveFinalOnboardingPath({...})`. Suppress the forced wizard
redirect when `reason` is `profile_complete` or `force_dashboard_global`.
Banner `<Link to={onboardingPath}>` keeps using the resolved path.

### 4. `src/pages/Auth.tsx` (only the post-signup redirect)
Replace `navigate('/wizard', { replace: true })` with `navigate('/', { replace: true })`
so Index.tsx applies the shared resolver. No other changes to Auth.tsx.

### 5. `src/pages/Join.tsx` (only the post-join redirect inside `autoJoin()`)
Pull `globalPath` from `useFirstLoginFlow()`, normalize
`pendingCompany.first_login_flow` to a path with the existing
`normalizeOnboardingPath` helper, then call `resolveFinalOnboardingPath({...})`
instead of the old `resolveOnboardingRoute` import from `firstLoginFlow.ts`.
The dashboard-only fast-path (`isDashboardOnly` short-circuit) is removed
because the adapter handles `/dashboard` natively. Add a
`[onboarding-route] source: 'join'` debug log.

## Out of scope
- `src/lib/firstLoginFlow.ts` `getFirstDestination` / `resolveOnboardingRoute`
  (still used by tests and `shouldGuardRedirect`/banner helpers). Not touching.
- `useFirstLoginFlow.ts` normalization. Already correct.
- Phone interstitial, post-wizard destination, company invite token flow.

## Verification I will return after build
1. `git diff` for the 5 files: `onboardingRoute.ts`, `Index.tsx`,
   `WizardGuard.tsx`, `Auth.tsx`, `Join.tsx`.
2. One runtime console log sample for a cold new login + global `dashboard_silent`
   showing `source: 'index'`, `reason: 'force_dashboard_global'`,
   `finalRedirectPath: '/dashboard'`.
3. Output of:
   ```
   rg -n '"/wizard"|to="/wizard"|Navigate to="/wizard"|navigate\([^)]*/wizard' \
     src/pages/Auth.tsx src/pages/Join.tsx src/pages/Index.tsx \
     src/components/auth/WizardGuard.tsx
   ```
   Expected: no matches in any of the 4 decision points.
4. `rg -n 'resolveFinalOnboardingPath' src` showing all 4 callers wired to the
   same adapter.
