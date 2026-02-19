
# Fix Tax Efficiency Checkbox Toggle

## Problem
Clicking directly on the checkbox circle does nothing because:
1. `onClick={(e) => e.stopPropagation()}` prevents the click from reaching the parent `div`
2. `onCheckedChange={(e) => e}` is a no-op that does nothing with the event

So clicks on the checkbox itself are completely swallowed.

## Fix (1 file: `src/pages/Profile.tsx`, lines 780-784)

Change the Checkbox to call the toggle handler from `onCheckedChange`, and keep `stopPropagation` on the native `onClick` to prevent the parent div from double-toggling:

```tsx
<Checkbox
  checked={taxAdvantagedAccounts.includes(account.value)}
  onCheckedChange={() => handleTaxAccountToggle(account.value)}
  onClick={(e) => e.stopPropagation()}
  id={`tax-${account.value}`}
/>
```

This way:
- Clicking the checkbox circle: `onCheckedChange` fires the toggle, `stopPropagation` prevents the parent div from also firing it
- Clicking the label/row area: parent div's `onClick` fires the toggle (checkbox doesn't re-fire since the click target isn't the checkbox)
