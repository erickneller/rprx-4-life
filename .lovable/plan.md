## Equity Recapture Calculator — implementation plan

A mortgage-acceleration calculator behind the existing paid-tier paywall, accessible from a new "Calculators" sidebar group. Logic from the uploaded bundle is copied verbatim; only Supabase import paths are rewired to the project's existing client.

### 1. Database
The target table `public.calculator_runs` already exists in this project with the correct columns, RLS policies, and `set_updated_at` trigger (verified in current schema). The bundled `supabase_migration.sql` is idempotent, but since the schema already matches, I'll run only what's missing:
- Add the composite index `calculator_runs_user_type_created_idx` on `(user_id, calculator_type, created_at desc)` if it isn't already there.
- Add explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculator_runs TO authenticated;` and `GRANT ALL ... TO service_role;` to guarantee Data API access.

No other schema changes.

### 2. Dependencies
Already installed: `react-hook-form`, `@hookform/resolvers`, `zod`, `@supabase/supabase-js`, `lucide-react`, and all required shadcn primitives (`card`, `button`, `input`, `label`, `select`, `dialog`, `table`). Nothing to add.

### 3. Calculator bundle (verbatim copy with one rewire)
Create `src/components/calculators/EquityRecapture/` with the seven files from the zip:
- `types.ts`, `calculations.ts`, `schema.ts`, `ResultsDisplay.tsx`, `SavedRunsList.tsx`, `Calculator.tsx`, `index.ts`

**Only modification:** swap `import { supabase } from '@/lib/supabase'` for `import { supabase } from '@/integrations/supabase/client'` in `Calculator.tsx` and `SavedRunsList.tsx`. This avoids creating a duplicate Supabase client (the project already has one with proper auth config) and keeps `calculations.ts` untouched as required.

Skip creating `src/lib/supabase.ts` for the same reason.

### 4. Print styles
Append the contents of `print-styles.css` to `src/index.css` (do not replace existing rules). Wrap in a clearly labeled section comment.

### 5. Route
In `src/App.tsx`, add inside the existing `UpgradeRouteGuard` block (paid-tier guard, matching Strategy Assistant / Plans / Debt Eliminator):
```tsx
<Route element={<UpgradeRouteGuard feature="equity-recapture-calculator" />}>
  <Route
    path="/calculators/equity-recapture"
    element={<ProtectedRoute><WizardGuard><EquityRecaptureCalculator /></WizardGuard></ProtectedRoute>}
  />
</Route>
```
Register `"equity-recapture-calculator"` as a new feature key in `src/lib/upgradeFeatures.ts` so the gate copy renders correctly.

### 6. Navigation
The sidebar (`src/components/layout/AppSidebar.tsx`) is driven by a categorized config (`useSidebarConfig`). Add a new top-level "Calculators" category containing one item:
- Label: "Equity Recapture"
- Path: `/calculators/equity-recapture`
- Icon: `Calculator` from lucide-react
- Tier-gated (paid) so free users see the same lock affordance other paid items get.

I'll inspect `useSidebarConfig`/`AppSidebar` first in build mode to insert the category in the right place and in the project's existing pattern.

### 7. Verification
- Run the Supabase linter after the migration.
- Load `/calculators/equity-recapture` as an authenticated paid user, run a default calculation, save a run, reload, delete a run, and trigger the print dialog to confirm the print stylesheet hides chrome.

### Out of scope
- No edits to `calculations.ts` math.
- No new Supabase client file.
- No dashboard cards, gamification hooks, or admin config — just route + nav.
