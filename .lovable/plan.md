

# Money Leak Estimator

## What It Does
Shows users how much money they may be leaving on the table annually, based on their saved plans. The focused plan (is_focus = true) drives recovery tracking. This creates a powerful "I need to know more" engagement hook displayed prominently on both the Results page and Dashboard.

## Database Changes

Add 3 columns to the `profiles` table:
- `estimated_annual_leak_low` (numeric, nullable, default 0)
- `estimated_annual_leak_high` (numeric, nullable, default 0)
- `estimated_annual_leak_recovered` (numeric, nullable, default 0)

No new tables needed. The `saved_plans.content` JSON will be extended with an optional `estimated_impact` field (`{ low, high, source }`), but since it's JSON this requires no schema migration.

## New Files

### 1. `src/lib/moneyLeakEstimator.ts`

Core calculation engine with:
- `MoneyLeakResult` and `LeakItem` types
- `parseEstimatedImpact(impact: string)` -- parses strategy_definitions strings like "$500-3,000/year", "Save $50-500/month" (annualized x12), with fallback {250, 1000}
- `calculateMoneyLeak(allPlans, focusedPlan)` -- sums leak ranges across all plans, calculates proportional recovery based on step completion, groups by horseman, returns top 5 sorted by impact

Recovery logic:
- Completed plans: add midpoint to totalRecovered
- In-progress plans: add proportional midpoint based on steps completed
- Plans missing estimated_impact in content: fallback to {500, 2000}
- Multi-horseman plans split impact evenly across their horsemen

### 2. `src/hooks/useMoneyLeak.ts`

- Reuses the existing `usePlans` and `useFocusPlan` hooks (no duplicate Supabase queries)
- Calls `calculateMoneyLeak()` with fetched data
- Persists leak values to profiles table on recalculation
- Returns `MoneyLeakResult`, `focusedPlan`, and `refreshLeak()`
- Uses React Query; auto-refreshes when plans data changes

### 3. `src/components/money-leak/MoneyLeakCard.tsx`

Visually striking dark gradient card (slate-800 to indigo-900):
- Animated headline: "You may be leaving $X,XXX -- $X,XXX per year on the table" with count-up animation (requestAnimationFrame, no external libs)
- Horizontal horseman breakdown bar (Interest=blue, Taxes=green, Insurance=purple, Education=amber), proportional segments
- Recovery progress section with green progress bar and percentage
- Focused plan progress mini-bar when applicable
- CTA button linking to /assessment, /plans, or focused plan depending on state
- Teaser state for users without plans
- `compact` prop for smaller placement
- Responsive, dark mode compatible

### 4. `src/components/money-leak/LeakBreakdownList.tsx`

Detailed list of plan leak items:
- Each row: plan title, horseman badges, estimated range, status badge, step progress
- Status badges: Not Started (gray), In Progress (blue), Completed (green)
- Top 5 with "Show all" expander
- Clicking navigates to /plans

## Modified Files

### `src/hooks/useProfile.ts`
Add 3 fields to Profile interface: `estimated_annual_leak_low`, `estimated_annual_leak_high`, `estimated_annual_leak_recovered`

### `src/hooks/usePlans.ts`
Extend `PlanContent` interface to include optional `estimated_impact: { low: number; high: number; source: string }`

### `src/components/plans/SavePlanModal.tsx`
When creating a plan, attempt to match the strategy name against `strategy_definitions` (case-insensitive), parse `estimated_impact`, and include it in the content JSON. Falls back to {500, 2000, "assessment"}.

### `src/components/results/ResultsPage.tsx`
Add `MoneyLeakCard` (full size) as the FIRST section above the radar chart

### `src/components/dashboard/DashboardContent.tsx`
Add `MoneyLeakCard` (full size) prominently after the Motivation card, with `LeakBreakdownList` below it

### `src/pages/PlanDetail.tsx`
On step toggle (`handleToggleStep`), after updating the plan:
- Show contextual toast on first step completion and subsequent steps
- When all steps completed, show celebration toast with estimated recovery amount
- Invalidate money-leak query to refresh the card

## Technical Notes

- Source of truth for money leak is `saved_plans`, NOT `user_active_strategies`
- Existing plans without `estimated_impact` in content get fallback values (500, 2000)
- Count-up animation uses `useEffect` + `requestAnimationFrame` with easing over ~1.5s
- Dollar amounts formatted with Intl.NumberFormat for commas
- All copy uses discovery language ("leaving money on the table"), never shame language

