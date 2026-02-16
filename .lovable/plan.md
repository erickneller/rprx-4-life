

# Streamline the Results Page Into a Single Transformational Path

## The Problem

The current Results page presents three competing calls-to-action in a confusing sequence:

1. **Quick Win Card** -- tells user to "do the Deep Dive below"
2. **Strategy Activation Card** -- asks user to commit to strategies (before understanding results)
3. **Deep Dive Wizard** -- refines recommendations (shown after strategies are already displayed)
4. **Diagnostic Feedback** -- explains what the results mean (buried below the action items)
5. **"Generate My Strategies" button** -- a separate AI-powered strategy path

Users see strategies to activate before they understand their situation, and two different strategy systems compete for attention.

## The Fix: A Linear Journey

Reorganize the Results page into a clear top-to-bottom narrative:

```text
1. Your Results (Radar Chart + Primary Horseman + Cash Flow)
     "Here's what we found"
          |
2. Understanding Your Results (Diagnostic Feedback)
     "Here's what it means"
          |
3. Quick Win Card
     "Here's one thing you can do right now"
          |
4. Deep Dive Wizard
     "Answer 5 questions to unlock your personalized plan"
          |
5. Strategy Activation Card (GATED -- only visible after Deep Dive is complete)
     "Now commit to the strategies that fit you"
          |
6. Generate My Strategies (AI button)
     "Or let us build a custom plan for you"
          |
7. RPRx Score + Tier Progress
     "See how you're progressing"
          |
8. Action Buttons (Dashboard / New Assessment)
```

## Key Changes

### 1. Reorder ResultsPage sections
Move Diagnostic Feedback and Primary Horseman/Cash Flow up (right after the radar chart) so users understand their results before seeing any strategies.

### 2. Gate the Strategy Activation Card behind Deep Dive completion
Pass the `alreadyCompleted` / `completed` state from Deep Dive to conditionally show StrategyActivationCard. Before the deep dive is done, the card stays hidden -- the Deep Dive wizard is the single clear next step.

### 3. Move gamification score to the bottom
RPRx Score and Tier Progress are motivational reinforcement, not the primary narrative. Move them below the strategy sections.

### 4. Merge the "Next Steps" heading
Remove the separate "Next Steps" section header. The "Generate My Strategies" button will sit naturally after Strategy Activation as an alternative path, under a combined strategies section.

---

## Technical Details

### File: `src/components/results/ResultsPage.tsx`

Reorder the JSX sections and add gating logic:

- Import and use `useExistingDeepDive` from `@/hooks/useDeepDive` to check if the deep dive is already completed
- Add a `deepDiveCompleted` state that flips to `true` when the `DeepDiveWizard` finishes (pass an `onComplete` callback prop)
- Conditionally render `StrategyActivationCard` only when deep dive is done
- New section order: Intro, Radar Chart, Primary Horseman + Cash Flow, Diagnostic Feedback, Quick Win, Deep Dive, (conditional) Strategy Activation + Generate Strategies, RPRx Score/Tier, Action Buttons

### File: `src/components/assessment/DeepDiveWizard.tsx`

Add an optional `onComplete` callback prop so the parent (`ResultsPage`) knows when the deep dive finishes and can reveal the strategy sections.

### File: `src/components/results/QuickWinCard.tsx`

Update the teaser text from "Complete the Deep Dive below..." to something that flows with the new position (it now sits directly above the Deep Dive).

### No database or migration changes needed.

