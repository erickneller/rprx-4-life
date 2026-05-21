## Goal

When a signed-in user opens `/health-assessment` inside the app, render it with the same left sidebar + header chrome as Dashboard, Profile, etc. Keep the existing iframe/embed behavior working for external sites.

## Changes

**`src/App.tsx`**
- Wrap the `/health-assessment` route in `ProtectedRoute` + `WizardGuard` (matching peers like `/assessments`).

**`src/pages/HealthAssessment.tsx`**
- Detect embed mode (existing `isEmbedded()` check — iframe or `?embed` query param).
- If embedded: render exactly as today (no chrome, postMessage height reporting intact).
- If not embedded: wrap the wizard in `<AuthenticatedLayout title="Health Assessment">` so the sidebar and breadcrumbs appear.
- Keep all current step rendering, progress bar, and store logic unchanged.

## Out of scope
- No changes to the wizard steps, scoring, or submission flow.
- No new sidebar nav entry (existing nav config already controls visibility).
- No styling changes inside the wizard itself.

## Verification
- Visit `/health-assessment` while signed in → sidebar + breadcrumb visible, wizard renders in main content area.
- Visit `/health-assessment?embed=1` (or inside an iframe) → no chrome, height postMessage still fires on step change.
- Signed-out visit → redirected to `/auth` (via ProtectedRoute), matching other internal pages.
