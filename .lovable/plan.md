# Fix company-invite onboarding flow

Two separate bugs are causing the reported behavior. Both are scoped to flow/routing code — no DB or business-logic changes.

## Bug 1 — `/join` ignores the first-login flow preset

`src/pages/Join.tsx` hardcodes `navigate('/wizard')` after signup (line 115), and the already-logged-in branch hardcodes `navigate('/dashboard')` (line 80). Neither consults `useFirstLoginFlow` + `getFirstDestination`, so admin-configured presets (e.g. `assessment_then_profile`, `dashboard_silent`, etc.) are bypassed for invited users.

### Fix

In `src/pages/Join.tsx`:
- Import `useFirstLoginFlow`, `useProfile`, `useAssessmentHistory`, `getFirstDestination`.
- Replace both hardcoded destinations with `getFirstDestination({ preset, isProfileComplete, hasAssessments }) ?? '/dashboard'`.
- For the post-signup branch, the new user has no profile/assessments yet, so call `getFirstDestination({ preset, isProfileComplete: false, hasAssessments: false })`. If it returns `null` (e.g. `dashboard_silent`), go to `/dashboard`; otherwise follow the preset (wizard, assessment, etc.). This matches what `Index.tsx` does for password/OAuth signups.
- For the already-logged-in auto-join branch, compute the same way using the actual profile/assessment state so returning users land where the preset dictates.

This keeps the company-join flow consistent with `Index.tsx` and `WizardGuard`.

## Bug 2 — Welcome card (and all configured cards) hidden for brand-new users

In `src/components/dashboard/DashboardContent.tsx` (lines 54–55, 137–141), when a user has zero assessments **and** zero saved plans, the dashboard short-circuits to only show `<DashboardStreakBar />` + `<StartAssessmentCTA isFirstTime />`. The admin-configured cards (including any custom "Welcome" video card from `useDashboardConfig`) are skipped entirely.

### Fix

Remove the `hasNoHistory` short-circuit so the configured cards always render. Specifically:
- Always render `DashboardStreakBar` + `DashboardCardRenderer` with `mergedCards`.
- Keep the existing fallback: if there's no focus plan and no active debt focus, render `<StartAssessmentCTA isFirstTime={isFirstTime} />` below the cards (this already handles the "nothing started yet" CTA).
- Drop the unused `hasNoHistory` branch.

Net result: new users see the welcome video card (and any other admin-pinned cards) plus the Start Assessment CTA at the bottom — instead of just the CTA.

## Files touched

- `src/pages/Join.tsx` — route both flows through `getFirstDestination`.
- `src/components/dashboard/DashboardContent.tsx` — remove `hasNoHistory` early-return.

No schema, hooks, or component API changes.
