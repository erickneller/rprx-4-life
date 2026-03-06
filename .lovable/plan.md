

# Fix: "Check my RPRx Score" scroll_to action not finding the card

## Problem

The onboarding day's "Check my RPRx Score" button uses `action_type: 'scroll_to'` with an `action_target` pointing to an element ID. However, the RPRx Score card rendered by `DashboardCardRenderer` has **no `id` attribute** on its wrapper `<div>`. So `document.getElementById(...)` returns `null` and nothing scrolls.

For reference, the Money Leak card works because it has `id="money-leak-card"` directly on its `<Card>` element.

## Fix

**File: `src/components/dashboard/DashboardCardRenderer.tsx`**

Add `id` attributes to the wrapper divs for each card, using a consistent naming convention based on the `component_key`. This makes all dashboard cards targetable by `scroll_to` actions.

In the rendering logic, pass the card's `component_key` (converted to kebab-case) as the `id` on each wrapper div. For example:
- `GamificationScoreCard` → `id="gamification-score-card"`
- `CurrentFocusCard` → `id="current-focus-card"`
- etc.

This is a ~3-line change: add a helper to convert keys to kebab-case IDs, then apply `id={cardId}` to the wrapper divs in both the full-width and partial-width render paths.

The onboarding content's `action_target` in the database should match the generated ID (e.g., `gamification-score-card`). You may need to update the existing `action_target` value in the `onboarding_content` table to match.

## Files Modified

- `src/components/dashboard/DashboardCardRenderer.tsx` — add `id` attributes to card wrappers

