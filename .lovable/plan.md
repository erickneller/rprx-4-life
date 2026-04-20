

## Fix: Make entire row clickable in Deep Dive multi-select

**Problem:** In `MultiSelectQuestion.tsx`, the row `<div>` has an `onClick={toggle}`, but the inner `<Label htmlFor={...}>` ALSO triggers the checkbox (which then bubbles back to the row's onClick). Clicking outside checkbox/label = single toggle (works). Clicking label = double-toggle (cancels out, appears broken). Clicking checkbox = also double-fires. This matches the user's complaint that clicking on the row text doesn't reliably select.

**Fix (single file: `src/components/assessment/MultiSelectQuestion.tsx`):**

1. Keep `onClick` on the outer row `<div>` as the single source of truth for toggling.
2. Make the inner `<Checkbox>` and `<Label>` visually-only — stop their click events from bubbling and remove the `htmlFor` linkage so they don't independently trigger toggles.
   - Add `onClick={(e) => e.stopPropagation()}` to Checkbox (or make it `pointer-events-none`).
   - Replace `<Label htmlFor=...>` with a plain `<span>` (or Label with no `htmlFor` and `pointer-events-none`).
3. Add `role="checkbox"`, `aria-checked`, `tabIndex={0}`, and keyboard handler (Space/Enter) on the row for accessibility.
4. Add `select-none` to prevent text-selection while clicking.

**Result:** Clicking anywhere on the row — checkbox area, label text, or empty space — toggles the option exactly once. Same fix pattern already used elsewhere in the app per the "Selection Affordance" memory.

No other files affected. No engine/scoring logic changes.

