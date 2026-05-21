## Problem

`isEmbedded()` treats any iframe context as "embedded" — but the Lovable preview/editor renders the app inside an iframe too. So even when you're signed in and viewing `/health-assessment` in the app, it's detected as embedded and the sidebar layout is skipped.

## Fix

**`src/pages/HealthAssessment.tsx`** — tighten `isEmbedded()` so it only returns true when explicitly embedded externally:

- Require the `?embed=1` query param (or `?embed`) as the sole signal for embed mode.
- Drop the `window.parent !== window` check (it produces false positives in Lovable preview, dev tools, and any host iframe).

External embedders just need to add `?embed=1` to the iframe `src` (which is the documented embed pattern anyway).

## Verification

- Signed-in visit to `/health-assessment` in the app → sidebar + header chrome render.
- `/health-assessment?embed=1` (or inside a real external iframe with that param) → no chrome, postMessage height events still fire.
- Signed-out visit → page still renders (route remains public).
