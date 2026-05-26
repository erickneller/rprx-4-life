## Changes

### 1. Remove RPRx score section from assessment results
In `src/components/results/ResultsPage.tsx`, remove the entire "RPRx Score & Tier" block at the bottom (the `GamificationScoreCard`, `TierProgressBar`, and the "Your RPRx Score updated…" paragraph). Drop the now-unused imports (`GamificationScoreCard`, `TierProgressBar`, `useRPRxScore`) and the `refreshScore` effect.

### 2. Add a feature flag to hide the Personalized Strategy card
Mirror the existing `streak_visible` / `xp_score_visible` pattern so admins can disable the internal strategy engine CTA.

- **Migration:** seed `('personalized_strategy_visible', true, 'Show the "Your Personalized Strategy" card on assessment results (turn off when not using the internal strategy engine)')` into `feature_flags`.
- **`src/components/admin/FeaturesTab.tsx`:** add a new toggle row "Personalized Strategy Card" using `useFeatureFlag('personalized_strategy_visible')` + `useToggleFeatureFlag('personalized_strategy_visible')`.
- **`src/components/results/ResultsPage.tsx`:** wrap the `<SuggestedPromptCard />` section in the flag check — render nothing when off.

### 3. Add "Save Strategy as PDF" button on results page
- **`src/components/results/ResultsPage.tsx`:** add a new "Save as PDF" outline button in the action row (alongside Edit / Return / Take New). It exports the current results view — Four Horsemen radar scores, primary horseman, cash flow status, and diagnostic feedback — to a downloadable PDF.
- **Implementation:** reuse the existing `jspdf` dependency (already used by `src/lib/planExport.ts` / `src/utils/health/pdfGenerator.ts`). Create a small helper `src/lib/resultsPdfExport.ts` that takes the assessment + scores + primary horseman + cash flow status and renders a branded one-page PDF (title, date, horsemen scores list, primary horseman, cash flow, diagnostic summary text). Filename: `rprx-results-<YYYY-MM-DD>.pdf`.

### Out of scope
- The RPRx score remains visible on dashboard, sidebar, profile — only removed from the results page bottom.
- No scoring logic changes.
- PDF is a text-based summary (not a screenshot of the radar chart) to keep it lightweight and reliable across themes.
