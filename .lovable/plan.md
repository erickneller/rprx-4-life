## Goal
Make the **RPRx Score** and **XP Score** independently show/hide-able via admin feature flags. They appear in the sidebar (compact), the dashboard streak bar, and the dashboard's Gamification card.

## Changes

### 1. Database — two new feature flags
Migration to insert into `feature_flags`:
- `rprx_score_visible` (default `true`) — controls visibility of the RPRx Score ring
- `xp_score_visible` (default `true`) — controls visibility of the XP total

### 2. Admin UI — `src/components/admin/FeaturesTab.tsx`
Add a new "Score Visibility" card with two switches (RPRx Score, XP Score) using existing `useFeatureFlag` / `useToggleFeatureFlag` hooks.

### 3. Gating in the UI
Read both flags and conditionally render each piece. If both are hidden, render nothing (return `null`) so layout collapses cleanly.

- **`src/components/gamification/GamificationScoreCard.tsx`** — compact and full modes: hide the RPRx ring block when `rprx_score_visible` is false; hide the XP block when `xp_score_visible` is false. In full mode, also hide the pillar breakdown + insights when RPRx is hidden (those belong to the score).
- **`src/components/dashboard/DashboardStreakBar.tsx`** — hide the XP pill when `xp_score_visible` is false. (Streak stays — it isn't part of this request.)
- **`src/components/dashboard/DashboardCardRenderer.tsx`** — if the GamificationScoreCard renders nothing (both flags off), skip its wrapper too. Simpler: let the component return null and the wrapper render an empty card; acceptable since admin can also hide via existing dashboard config. No change needed unless we want stricter cleanup — will add a small guard.

## Out of scope
- The `RPRxScoreCard` on the results page and the `TierProgressBar` are not touched (results page is part of the assessment journey, not a dashboard widget). Confirm if you want those gated too.
- Profile page stats and admin Users tab columns are unchanged.
