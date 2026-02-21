

# Simplify Money Leak Card — Show Only After First Plan

## Overview
Remove the Money Leak Card from the Results page entirely and simplify it on the Dashboard to only appear once the user has at least one saved plan. No more funnel states (no assessment, no plan, no focus) — the card is simply hidden until there's real data to show.

## Changes

### 1. Remove MoneyLeakCard from Results page
**File: `src/components/results/ResultsPage.tsx`**
- Remove the `MoneyLeakCard` import (line 11)
- Remove the "Money Leak Estimator" section (lines 98-101)
- The results page will go straight from the intro heading to the radar chart

### 2. Simplify MoneyLeakCard — remove empty states
**File: `src/components/money-leak/MoneyLeakCard.tsx`**
- Remove States 1, 2, and 3 (the "no assessment", "no plans", "no focus" CTA cards)
- If no plans exist, return `null` (card is invisible)
- If plans exist but none focused, still show the estimator totals across all plans (current State 4 behavior minus the focus-specific progress)
- Keep the compact variant as-is

### 3. Simplify useMoneyLeak hook
**File: `src/hooks/useMoneyLeak.ts`**
- Remove the `hasAssessment` query entirely — no longer needed since the card won't show pre-plan states
- Remove the `assessmentLoading` from the loading state
- Keep `hasPlans` and `hasFocusPlan` flags for the card's internal rendering decisions

### What stays the same
- The `LeakBreakdownList` on the dashboard (already only renders when plans exist)
- The dashboard card config — `MoneyLeakCard` stays registered; it just renders nothing when there are no plans
- All calculation logic in `moneyLeakEstimator.ts`
- Persistence of leak estimates to profiles

