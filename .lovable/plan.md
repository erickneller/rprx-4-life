
## Match Plan Card Progress Bar to Cobalt Blue

### Problem
The progress bar in the PlanCard component uses a custom implementation with `bg-primary` (dark slate) instead of using the shared Progress UI component or the `bg-accent` color (cobalt blue).

---

## Solution
Update the custom progress bar in PlanCard.tsx to use `bg-accent` instead of `bg-primary`, matching the other progress bars and sliders we just updated.

---

## Change Required

### File: `src/components/plans/PlanCard.tsx`

**Line 58 - Change the progress bar fill color:**
```tsx
// Before
className="h-full bg-primary transition-all"

// After  
className="h-full bg-accent transition-all"
```

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| Plan card progress bar | Dark slate | Cobalt blue |

This is a single-line change that will make the plans page progress bars consistent with the rest of the app.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/plans/PlanCard.tsx` | Line 58: Change `bg-primary` to `bg-accent` |
