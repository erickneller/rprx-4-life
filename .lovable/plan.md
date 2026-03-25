

# Auto-Advance on Answer Selection

## Concept
When a user selects an answer for single-choice, yes/no, or range-select questions, automatically advance to the next question after a brief 400ms delay. This gives visual feedback (the selected option highlights) before moving on. Multi-select and slider questions are excluded since they require multiple interactions before the user is done.

The "Previous" button still works as normal so users can go back and change answers.

## Changes

### `src/components/assessment/AssessmentWizard.tsx`
- Create an `autoAdvance()` callback that calls `handleNext()` after a 400ms `setTimeout`
- For **core phase**: wrap `setResponse` so that for `single_choice`, `yes_no`, and `range_select` question types, it triggers `autoAdvance()` after setting the value
- For **deep dive phase**: same pattern — after `setDeepDiveAnswer`, auto-advance for `single_choice` and `range_select` types
- Use a `useRef` for the timeout so it can be cleared on unmount or if the user navigates manually
- Skip auto-advance on the last core step (transition screen) and last deep dive step (submit) — those require explicit button clicks

### No changes to question components
`SingleChoiceQuestion`, `YesNoQuestion`, `RangeSelectQuestion` already call `onChange` on selection. The auto-advance logic lives entirely in `AssessmentWizard.tsx`.

## UX Details
- 400ms delay provides enough time to see the selection highlight
- If user clicks "Previous" during the delay, the timeout is cancelled
- Last question of each phase always requires manual "Continue" / "Complete" click to avoid accidental submission

