

# Fix Auto-Advance + Apply to All Question Types

## Why It's Not Working
Question 1 is a **slider** type, and sliders were explicitly excluded from auto-advance. The user wants auto-advance on ALL question types.

There's also a subtle issue: `QuestionCard` auto-selects the first slider option on mount (line 17-20), which calls `onChange` immediately. Without protection, this would auto-advance before the user even reads the question.

## Plan

### 1. `src/components/assessment/AssessmentWizard.tsx`

**Enable auto-advance for all question types:**
- Remove the `question_type` filter from `handleCoreResponse` and `handleDeepDiveResponse` — auto-advance triggers for every type except multi-select (since the user may want to select multiple items)
- For multi-select: keep a visible "Continue" / "Next" button since we can't know when the user is done selecting

**Prevent auto-advance on slider auto-select (mount):**
- Add a `skipAutoAdvanceRef = useRef(false)` that gets set to `true` whenever `currentStep` or `deepDiveStep` changes
- In `handleCoreResponse` / `handleDeepDiveResponse`: if the question is a slider AND `skipAutoAdvanceRef.current` is true, clear the flag but skip auto-advance. This prevents the initial auto-select from advancing. The next user interaction will auto-advance normally.

**Hide Next button when auto-advance is active:**
- For core phase: hide the Next button on non-final steps unless the current question is multi-select (or slider where the user might want to confirm). Show only "Previous" on the left.
- Keep "Continue →" on the last core step and "Complete Assessment" on the last deep dive step
- For deep dive: same logic — hide Next except on multi-select questions and the final step

### 2. No changes to question components
All `onChange` callbacks remain the same. The logic stays in AssessmentWizard.

## UX Summary
- User selects any option → 400ms delay → auto-advances
- Slider: first render auto-selects (no advance); user drags → advances
- Multi-select: user picks options, then taps a visible "Continue" button
- Last step of each phase: always shows explicit button
- Previous button always visible (clears any pending auto-advance)

