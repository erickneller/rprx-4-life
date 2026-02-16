
# Streamline to a Single-Strategy Transformational Path

## Overview

This is a significant UX overhaul that transforms the assessment-to-strategy flow from "buffet of options" into a focused, guided journey: **one strategy at a time, earned through completing the full assessment (including Deep Dive), editable at any point**.

## What Changes

### 1. Merge Deep Dive into the Assessment Wizard (mandatory)
Currently the Deep Dive is a separate widget on the Results page. Instead, after the user answers the 15 core questions, the wizard seamlessly continues with the 5 Deep Dive questions (loaded based on the primary horseman calculated mid-flow). The user completes all 20 questions in one sitting before seeing results.

- **AssessmentWizard.tsx**: After the last core question, calculate the primary horseman on-the-fly, fetch deep dive questions, and continue the wizard seamlessly (show a brief interstitial like "Great! 5 more questions to personalize your strategy...")
- **useAssessment.ts**: Add a "phase 2" state that loads deep dive questions and appends them. Submit both assessment + deep dive records together at the end.
- **DeepDiveWizard.tsx**: Keep the component for potential standalone use, but it will no longer appear on the Results page.

### 2. Make the entire assessment editable
Add an "Edit Answers" mode on the Results page that lets users revisit and change both core and deep dive answers, then recalculate scores.

- **ResultsPage.tsx**: Add an "Edit My Answers" button that navigates to `/assessment/edit/{assessmentId}`
- **New route/page**: `AssessmentEditor` -- loads existing responses (core + deep dive) into the wizard, lets user change answers, then re-submits (updates existing records rather than creating new ones)
- **useAssessment.ts**: Add an "edit mode" that pre-populates responses and uses `UPDATE` instead of `INSERT`

### 3. Simplify the Results page (remove clutter)
Remove the following from ResultsPage:
- **QuickWinCard** -- removed entirely
- **StrategyActivationCard** (Recommended Strategies list) -- removed entirely
- **DeepDiveWizard** -- removed (now part of the assessment)

The Results page becomes:
1. Radar Chart + Primary Horseman + Cash Flow (diagnosis)
2. Diagnostic Feedback (what it means)
3. "Generate My Next Strategy" button (single CTA)
4. RPRx Score + Tier Progress
5. Edit Answers / Dashboard / New Assessment buttons

### 4. One strategy at a time
- **SuggestedPromptCard.tsx**: Rename button to "Generate My Next Strategy". Change the prompt from "recommend exactly 3 strategies" to "recommend the single best next strategy for my situation, considering strategies I've already completed"
- **promptGenerator.ts**: Update `generateAutoStrategyPrompt` to request 1 strategy instead of 3. Include the user's completed strategies in the prompt context so the AI doesn't repeat them.
- **ChatThread.tsx auto-mode**: Update the follow-up message to request steps for 1 strategy (not 3). The "Create My Plan" button auto-saves and navigates directly to the plan detail page.
- **Strategy unlock logic**: After completing a strategy (marking all steps done on the Plan Detail page), show a prompt: "Ready for your next strategy?" linking back to the Results page to generate another.

### 5. Remove the multi-strategy activation system
- **StrategyActivationCard.tsx**: No longer rendered anywhere
- **MyStrategiesCard.tsx on Dashboard**: Refactor to show only the user's current active plan (from `saved_plans`) with progress, instead of pulling from `user_active_strategies`
- The `user_active_strategies` and `strategy_definitions` tables remain in the DB but are no longer the primary flow -- the AI-generated single plan in `saved_plans` becomes the core execution path

### 6. Auto-navigate to plan after generation
When the user clicks "Generate My Next Strategy":
- Show a loading state on the Results page (no redirect to Strategy Assistant chat)
- Send the prompt, wait for the response, parse it, auto-create the plan in `saved_plans`
- Navigate directly to `/plans/{id}` -- the user lands on their actionable checklist immediately
- This replaces the current flow of: Results -> Strategy Assistant chat -> read conversation -> click "Create My Plan" -> Plan Detail

## Flow Diagram

The new user journey:

```text
Take Assessment (15 core + 5 deep dive = 20 questions)
         |
    Results Page
    (Diagnosis + Feedback + "Generate My Next Strategy")
         |
    [Edit Answers]  or  [Generate My Next Strategy]
         |                      |
   Re-take wizard         Loading... AI generates plan
         |                      |
    Updated Results       Auto-navigate to Plan Detail
                                |
                          Complete steps (checklist)
                                |
                          "Ready for next strategy?"
                                |
                          Back to Results -> Generate next
```

## Technical Details

### Files to modify:
- **src/components/assessment/AssessmentWizard.tsx** -- add deep dive phase after core questions
- **src/hooks/useAssessment.ts** -- add deep dive integration, edit mode support
- **src/components/results/ResultsPage.tsx** -- remove QuickWinCard, DeepDiveWizard, StrategyActivationCard; add edit button; simplify layout
- **src/components/results/SuggestedPromptCard.tsx** -- rename to "Generate My Next Strategy", change to single-strategy prompt, add inline generation (no chat redirect)
- **src/lib/promptGenerator.ts** -- change prompt to request 1 strategy, include completed strategies as context
- **src/components/assistant/ChatThread.tsx** -- update auto-mode follow-up for single strategy
- **src/components/dashboard/MyStrategiesCard.tsx** -- refactor to show current active plan from `saved_plans` instead of `user_active_strategies`
- **src/components/dashboard/DashboardContent.tsx** -- minor adjustments for new card
- **src/pages/PlanDetail.tsx** -- add "Ready for next strategy?" CTA when plan is completed
- **src/App.tsx** -- add route for assessment editor

### Files to remove/deprecate:
- **src/components/results/QuickWinCard.tsx** -- no longer used
- **src/components/results/StrategyActivationCard.tsx** -- no longer used on results page

### No database migrations required
- All existing tables (`saved_plans`, `user_deep_dives`, `user_assessments`, `assessment_responses`) support this flow
- `user_active_strategies` and `strategy_definitions` remain but become secondary

### Phased implementation
Given the scope, this should be implemented in 2 phases:

**Phase 1 -- Core flow changes:**
- Merge Deep Dive into Assessment Wizard
- Simplify Results page (remove clutter)
- Change "Generate My Strategies" to single-strategy generation with auto-navigate to plan
- Update prompt to request 1 strategy

**Phase 2 -- Polish:**
- Add assessment edit mode
- Add "Ready for next strategy?" on completed plans
- Refactor Dashboard MyStrategiesCard to show current plan
- Include completed strategies in prompt context to avoid repeats
