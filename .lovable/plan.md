Align the empty-state Health Assessment card layout and button to match the Financial Assessment card above it.

Current state
- The "Start Health Assessment" button sits on the right side of the card (`justify-between`).
- The button has no arrow icon and uses the default button style.
- The Financial Assessment card above it shows a left-aligned button with an arrow icon and accent styling.

Plan
1. In `src/components/dashboard/HealthAssessmentHistory.tsx`, restructure the empty-state `CardContent` so the text block sits on the left and the button sits below it on the left (stacked vertically), removing the right-aligned `justify-between` layout.
2. Update the "Start Health Assessment" button to use the same accent style and add an `ArrowRight` icon after the text, matching the "Start Financial Assessment" button.
3. Verify the card visually aligns with the Financial Assessment card in the preview.

No database or other components are affected.