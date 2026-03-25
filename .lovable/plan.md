

# Convert Slider Questions to Single-Choice Radio Buttons

## What
Render all `slider` type questions using the same `SingleChoiceQuestion` radio button component instead of the `SliderQuestion` slider component. This fixes the usability and auto-advance issues with sliders.

## Changes

### `src/components/assessment/QuestionCard.tsx`
- In the `switch` statement, make the `'slider'` case render `<SingleChoiceQuestion>` instead of `<SliderQuestion>`
- Remove the `useEffect` that auto-selects the first slider option on mount (no longer needed since radio buttons start unselected, matching single-choice behavior)
- Remove the `SliderQuestion` import

### `src/components/assessment/AssessmentWizard.tsx`
- Remove the `skipAutoAdvanceRef` logic that was specifically added to handle slider mount auto-select. Since sliders now behave like single-choice (no auto-select on mount), this guard is unnecessary
- Slider questions will auto-advance naturally on selection, just like single-choice and yes/no

### Cleanup
- `SliderQuestion.tsx` can be left in place (no harm) or deleted as dead code

## Result
All question types use tap-to-select UI. Auto-advance works consistently since there's no mount-triggered `onChange` to guard against.

