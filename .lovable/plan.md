
# Streamline to a Single-Strategy Transformational Path

## Status: Phase 1 ✅ Complete | Phase 2 🔲 Pending

## Overview

This is a significant UX overhaul that transforms the assessment-to-strategy flow from "buffet of options" into a focused, guided journey: **one strategy at a time, earned through completing the full assessment (including Deep Dive), editable at any point**.

## Phase 1 — COMPLETED ✅

### 1. ✅ Merged Deep Dive into Assessment Wizard (mandatory)
- `useAssessment.ts` now has `phase` state: `core` → `transition` → `deep_dive`
- After 15 core questions, calculates primary horseman, fetches deep dive questions, shows transition screen
- Deep dive questions rendered inline in AssessmentWizard with same navigation
- Both assessment + deep dive records saved together on final submit

### 2. ✅ Simplified Results page
- Removed QuickWinCard, StrategyActivationCard, DeepDiveWizard from ResultsPage
- Results page now: Radar Chart → Horseman + Cash Flow → Diagnostic Feedback → "Generate My Next Strategy" → RPRx Score → Action Buttons
- Added "Edit My Answers" button (navigates to `/assessment/edit/{id}` — route TBD in Phase 2)

### 3. ✅ Single-strategy generation with auto-navigate
- SuggestedPromptCard renamed to "Generate My Next Strategy"
- Sends prompt, gets AI response, sends follow-up for steps, parses response, auto-creates plan in `saved_plans`
- Navigates directly to `/plans/{id}` — no chat intermediary
- promptGenerator requests exactly 1 strategy, includes completed strategies to avoid repeats

### 4. ✅ "Ready for next strategy?" on completed plans
- PlanDetail page shows CTA when plan is completed, linking back to latest assessment results

## Phase 2 — PENDING 🔲

### Assessment edit mode
- Create `/assessment/edit/{assessmentId}` route and page
- `useAssessment.ts` edit mode: pre-populate responses, use UPDATE instead of INSERT
- Allow editing both core and deep dive answers, recalculate scores

### Dashboard MyStrategiesCard refactor
- Show current active plan from `saved_plans` with progress instead of `user_active_strategies`

### Cleanup
- Consider removing unused `QuickWinCard.tsx` and `StrategyActivationCard.tsx` files
- ChatThread auto-mode may need updates for single-strategy context
