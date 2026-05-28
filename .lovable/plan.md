## Diagnosis

The user landed at `app.rprx4life.com/wizard` after joining Tester3. Verified state:

- `companies.first_login_flow = NULL` for Tester3 → `companyOverrideEnabled = false`
- `feature_flags.first_login_flow = 'dashboard_silent'` → `globalPath = '/dashboard'`
- Both Tester3 profiles have `phone` set, `onboarding_completed = false`, `monthly_income = NULL` → `isProfileComplete = false`

With this state, `resolveFinalOnboardingPath` MUST return `/dashboard` (rule: `force_dashboard_global`). The current code in main is correct. So there are two real possibilities:

### Possibility A (most likely): production bundle is stale
`app.rprx4life.com` is the published build. The unified-adapter + `/wizard` guard changes from earlier turns only ship after a new Publish. The preview at `id-preview--…lovable.app` already has them. If production hasn't been re-published since those fixes, old `Auth.tsx` / `Join.tsx` still call `navigate('/wizard')` directly and the `/wizard` route isn't behind `WizardGuard`.

**Action:** Publish the project to push the latest build to `app.rprx4life.com`, then retest the invite link in incognito.

### Possibility B: `WizardGuard` "no profile yet" loophole
Even after publishing, there's one residual gap I want to close. In `src/components/auth/WizardGuard.tsx`:

```tsx
if (!profile) return <>{children}</>;
```

If a user hits `/wizard` directly during the brief window where `useProfile` has resolved but the row doesn't exist yet (DB trigger lag right after signup), the guard lets `<Wizard />` render before the route resolver has anything to compute. That's the only way a fully up-to-date prod build can still show `/wizard` to a dashboard-preset cold user.

**Fix:** On the `/wizard` route specifically, never pass through with a missing profile — show the loading state instead. Elsewhere keep the existing pass-through so other guarded routes (dashboard, results, etc.) don't gate on a brand-new profile.

```tsx
const isWizardRoute = location.pathname === '/wizard' || location.pathname.startsWith('/wizard/');

if (!profile) {
  if (isWizardRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  return <>{children}</>;
}
```

This guarantees `/wizard` is only reachable after the resolver has run with a real profile, at which point the existing `if (isWizardRoute && onboardingPath !== '/wizard')` branch bounces dashboard-preset users to `/dashboard`.

## Plan

1. Edit `src/components/auth/WizardGuard.tsx` — add the `isWizardRoute` short-circuit inside the `!profile` branch (single small change, no behavior shift on any non-wizard route).
2. Re-run the `rg` checks you required last round to confirm no direct `/wizard` navigations or unguarded `/wizard` route definitions remain.
3. After you Publish, retest `/join?token=caef9a1c-…` from a fresh incognito window and confirm the `[onboarding-route]` console log shows `finalRedirectPath: '/dashboard'` and `reason: 'force_dashboard_global'`.

## Out of scope

- No DB changes (DB state is correct).
- No changes to Join/Auth/Index — those already route through the unified adapter on `/`.
- No changes to `resolveFinalOnboardingPath` — its logic is already correct for this case.
