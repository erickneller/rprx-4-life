## Plan: Company invite signups should go straight to dashboard

### Problem
New accounts created from `/join?token=...` can still land on the Financial Snapshot wizard even when **First-Login Flow** is set to **Dashboard only — silent**.

The likely cause is a race in `src/pages/Join.tsx`: right after signup, the app computes the redirect before the new profile row is reliably available. Because `isProfileComplete` is false during that moment, some flows can resolve to `/wizard` or get caught by older wizard-first logic.

### Fix
1. **Make invite signup redirects deterministic**
   - Update `src/pages/Join.tsx` so after signup/login through a company invite it waits until:
     - the invite has been joined,
     - the profile query has actually returned a profile,
     - the first-login preset has loaded,
     - assessment history has loaded.

2. **Respect dashboard-only settings first**
   - If the preset is `dashboard_silent` or `dashboard_nudge`, route invited users directly to `/dashboard` after the company join succeeds.
   - This avoids computing wizard destinations from incomplete brand-new profile data.

3. **Keep required onboarding behavior for other presets**
   - For `profile_then_assessment`, `assessment_then_profile`, `assessment_only`, and `profile_only`, keep using the existing `getFirstDestination()` logic.

4. **Update outdated inline docs**
   - Change the stale `/join` comment that says signup goes to `/wizard` so it matches the configurable first-login flow.

### Files to change
- `src/pages/Join.tsx`

### Validation
- Confirm the invite flow now routes `dashboard_silent` / `dashboard_nudge` invite signups to `/dashboard`.
- Confirm other first-login presets still route as configured.