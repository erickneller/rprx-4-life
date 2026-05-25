## Goal

Let an admin control where brand-new users land on first login, and the order of steps they must complete. Today the order is hard-coded: phone → profile wizard → assessment → deep dive → dashboard.

## How it will work

Add a new admin setting **"First-Login Flow"** in Admin → Features. Admin picks one of these presets:

1. **Profile → Assessment → Dashboard** (current default)
2. **Assessment → Profile → Dashboard** (reversed)
3. **Assessment only → Dashboard** (skip profile wizard; profile becomes optional/banner-only)
4. **Profile only → Dashboard** (skip assessment requirement)
5. **Dashboard only — silent** (no forced onboarding, no banner, no nudges)
6. **Dashboard only — with nudges** (free explore, but show the persistent "Complete your profile" and "Take your assessment" banners until done)

Phone capture (`/complete-phone`) for Google OAuth users stays mandatory in every preset since it's a registration requirement, not onboarding.

## Where the change lands

- **`src/pages/Index.tsx`** — first destination after login. Branches on the selected preset to send users to `/wizard`, `/assessment`, or `/dashboard` first.
- **`src/components/auth/WizardGuard.tsx`** — currently force-redirects users with no assessments AND incomplete profile back to `/wizard`. Will:
  - Preset 2: redirect to `/assessment` first instead.
  - Preset 3: redirect to `/assessment`, never to `/wizard`.
  - Preset 4: keep current wizard redirect, drop the assessment requirement.
  - Preset 5: no redirect, no banner.
  - Preset 6: no redirect, but render banners for any missing piece (profile, assessment).
- **`src/components/wizard/ProfileWizard.tsx`** finish handler — after profile completion, go to `/assessment` only if the preset requires assessment next and the user has none yet; otherwise `/dashboard`.
- **`src/components/results/ResultsPage.tsx`** — no change unless an admin-selected preset wants results → profile (not in current preset list).

## Storage

Use the existing `feature_flags` pattern. Since today's `feature_flags` rows are boolean, add a tiny migration to support a string value:
- Add a nullable `value text` column to `feature_flags` (boolean `enabled` stays for existing flags).
- Insert a row `flag_id = 'first_login_flow'` with `value = 'profile_then_assessment'` as default.

Build `useFirstLoginFlow()` hook returning the active preset key, plus a shared helper `getFirstDestination(preset, profile, hasAssessments)` so `Index.tsx` and `WizardGuard.tsx` use one source of truth.

## Admin UI

In `src/components/admin/FeaturesTab.tsx`, add a "First-Login Flow" card with a radio group for the 6 presets and a one-line description under each.

## Out of scope

- Reordering individual steps inside the Profile Wizard.
- Per-company or per-horseman overrides (single global setting for now).
- Changes to the existing 30-day onboarding journey (separate system).
