
## Make Completed Checkboxes Green

### Overview
Change the checkbox color from the default primary (black/dark) to green when a step is marked as completed in the plan checklist.

---

## Change Required

**File:** `src/components/plans/PlanChecklist.tsx`

Add conditional Tailwind classes to the `Checkbox` component to override the default checked state colors:

```tsx
<Checkbox
  checked={isCompleted}
  onCheckedChange={() => onToggleStep(index)}
  disabled={disabled}
  className={cn(
    "mt-0.5",
    isCompleted && "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
  )}
/>
```

---

## Technical Details

| Class | Purpose |
|-------|---------|
| `data-[state=checked]:bg-green-600` | Green background when checked |
| `data-[state=checked]:border-green-600` | Green border when checked |

The Radix UI Checkbox uses `data-state="checked"` attribute when selected, so we can target it with Tailwind's data attribute selector.

---

## Result
- Unchecked: Default primary color (dark border)
- Checked: Green background and border with white checkmark
