

# Context-Aware Day 1 Onboarding CTA

## Problem
The Day 1 onboarding card always shows "View My Money Leak Estimate" with a `scroll_to` action targeting `money-leak-card`. But this card only renders when the user has at least one saved plan with estimated impact data. For new users who just completed their first assessment, the money-leak-card doesn't exist yet, so the button scrolls to nothing.

## Solution
Override the Day 1 CTA in `OnboardingCard.tsx` with context-aware logic that checks the user's current state and renders the appropriate button. The database content remains unchanged (it serves as the fallback/default), but the component dynamically swaps the button text and action based on a priority waterfall.

## State Priority (checked in order)

1. **No plans exist** -- Button: "Build My Recovery Plan" -- Action: trigger the same auto-generation flow used in `SuggestedPromptCard` (calls the AI, parses the strategy, saves a plan), then refreshes dashboard queries so the money-leak-card appears inline
2. **Plan exists but no active strategies** -- Button: "Activate My First Strategy" -- Action: navigate to `/plans?prompt=activate`
3. **Plan exists + active strategy + estimated_annual_leak_low > 0** -- Button: "View My Money Leak" -- Action: scroll to `money-leak-card` (current behavior)
4. **Plan exists but estimated_annual_leak_low === 0** -- Button: "See My Results" -- Action: navigate to `/results/{latestAssessmentId}`

## Technical Changes

### 1. New hook: `src/hooks/useDayOneCTA.ts`
Encapsulates all state-checking logic in a clean hook that returns `{ buttonText, action, isGenerating }`.

- Queries `saved_plans` count (reuses `usePlans`)
- Queries `user_active_strategies` count
- Reads `estimated_annual_leak_low` from `useProfile`
- Gets latest assessment ID from `useAssessmentHistory`
- Exposes an `action()` function that does the right thing per state
- For State 1, contains the auto-generation logic extracted from `SuggestedPromptCard` (same prompt builder, same parser, same plan creation). After plan creation, invalidates `['plans']` and `['profile']` queries instead of navigating away. This causes the dashboard to re-render with the money-leak-card visible and the CTA to auto-update to State 3.

### 2. Extract generation logic: `src/lib/autoStrategyGenerator.ts`
Move the core generation flow from `SuggestedPromptCard.handleGenerate` into a reusable async function so both `SuggestedPromptCard` and the new Day 1 CTA can call it without duplication.

```text
autoGenerateStrategy(params) -> Promise<SavedPlan>
  - params: { profile, assessment, responses, existingPlanNames, createPlan }
  - Returns the created plan
  - Does NOT navigate (caller decides)
```

### 3. Update `src/components/results/SuggestedPromptCard.tsx`
Refactor to call `autoGenerateStrategy()` instead of inline logic. Keeps the navigate-to-plan behavior after generation.

### 4. Update `src/components/onboarding/OnboardingCard.tsx`
- Import `useDayOneCTA`
- When `currentDay === 1` and it's not a quiz/reflection, replace the default action button with the context-aware CTA from the hook
- All other days continue using the database-driven `action_text` / `action_type` / `action_target` as before
- Show a loading spinner on the button during generation (State 1)

### 5. No database changes needed
The `onboarding_content` row for Day 1 stays as-is. The component simply overrides the CTA when `day_number === 1`.

## Key Behavior
- After "Build My Recovery Plan" completes, the dashboard re-renders (queries invalidated), the money-leak-card appears, and the onboarding card CTA automatically switches to "View My Money Leak" since the state has changed
- No page navigation occurs during generation -- user stays on the dashboard throughout
- The free-tier plan limit check (max 1 plan) is preserved in the shared generator function

