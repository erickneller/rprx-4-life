# Per-company onboarding override + unified resolver

## Goal
Today the first-login route is decided by a **global** `first_login_flow` feature flag (preset enum like `profile_then_assessment`, `dashboard_silent`, etc.). The default preset (`profile_then_assessment`) is what's actually sending new users to `/wizard` — not a hardcoded route.

We'll add a **per-company override** so admins can pick a different first-login preset for users who join via a specific company's invite link, and consolidate the routing decision into one resolver used everywhere.

## Behavior

- **Resolver inputs:** `(globalPreset, companyPreset | null, { isProfileComplete, hasAssessments })`
- **Precedence:** `companyPreset ?? globalPreset` → feed into existing `getFirstDestination`.
- **No company / no override set:** falls back to the global preset (today's behavior).
- **Phone capture** and **onboarding-complete → dashboard** checks are preserved exactly as they are.
- The "fallback to `/wizard`" you mentioned is what `profile_then_assessment` already does — no separate hardcode is being introduced or removed.

## Database

Add a nullable column to `companies`:
- `first_login_flow text` — when set, overrides the global preset for any user whose `profile.company_id` matches.

(No RLS changes needed — company admins already have UPDATE on their company row.)

## Code changes

### 1. `src/lib/firstLoginFlow.ts`
Add a new resolver that both Index and WizardGuard will call:

```ts
export interface OnboardingConfig {
  globalPreset: FirstLoginFlowPreset;
  companyPreset?: FirstLoginFlowPreset | null;
}
export function resolveOnboardingPreset(cfg: OnboardingConfig): FirstLoginFlowPreset {
  return cfg.companyPreset ?? cfg.globalPreset;
}
export function resolveOnboardingRoute(
  cfg: OnboardingConfig,
  state: { isProfileComplete: boolean; hasAssessments: boolean }
): string | null {
  return getFirstDestination({ preset: resolveOnboardingPreset(cfg), ...state });
}
```
(Existing `getFirstDestination`, `shouldGuardRedirect`, nudge helpers stay; `shouldGuardRedirect` will be called with the resolved preset.)

### 2. `src/hooks/useFirstLoginFlow.ts`
Add a sibling hook `useCompanyFirstLoginFlow(companyId)` that reads `companies.first_login_flow` (cached, nullable). Existing hook unchanged.

### 3. `src/pages/Index.tsx`
Replace the direct `getFirstDestination` call with `resolveOnboardingRoute({ globalPreset: preset, companyPreset }, { isProfileComplete, hasAssessments })`, sourcing `companyPreset` from the new hook using `profile.company_id`.

### 4. `src/components/auth/WizardGuard.tsx`
Same swap. The guard's `shouldGuardRedirect(...)` call uses `resolveOnboardingPreset(...)`. Phone-capture and onboarding-complete paths are untouched.

### 5. `src/pages/Join.tsx`
After the user joins the company, resolve destination using **that company's** preset (already in scope from the lookup) instead of the global one. This is the key win: company invite links honor the company's chosen flow.

### 6. `src/components/admin/CompaniesTab.tsx`
Add a per-row "First-login flow" select with options from `FIRST_LOGIN_FLOW_OPTIONS` plus a "Use global default" choice (null). Saves to `companies.first_login_flow`.

## Tests
Add `src/lib/__tests__/firstLoginFlow.test.ts` (Vitest):
- `resolveOnboardingPreset` returns company preset when set, global otherwise.
- `resolveOnboardingRoute` for each preset × profile state combo:
  - new user, company=`dashboard_silent`, global=`profile_then_assessment` → `null` (dashboard)
  - new user, no company preset, global=`profile_then_assessment` → `/wizard`
  - profile complete + no assessments, `profile_then_assessment` → `/assessment`
  - everything done → `null`
- `shouldGuardRedirect(resolveOnboardingPreset(...))` is false for dashboard presets.

Add a lightweight WizardGuard behavior test (React Testing Library) covering:
- Company override `dashboard_silent` + incomplete profile → renders children (no redirect).
- No override + incomplete profile + global `profile_then_assessment` → redirects to `/wizard`.
- `profile.onboarding_completed = true` → renders children regardless.

## Acceptance mapping
- New user + company override set to X → lands on X. ✓ (Join.tsx + Index.tsx + WizardGuard.tsx all read company preset)
- New user + no override → lands per global preset (today's `/wizard` default). ✓
- Returning / onboarding-complete user → dashboard flow preserved. ✓ (`!profile.onboarding_completed` gate unchanged)
- Protected routes won't bounce to `/wizard` when company picks a dashboard preset. ✓
