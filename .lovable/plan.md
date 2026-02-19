

# Add "None" Option to Tax Efficiency Section

## What Changes

Add a "None of these" toggle to the Tax-Advantaged Accounts list in the Profile page, following the same mutual-exclusion pattern already used in the Insurance section (where "I don't have any insurance" deselects all specific coverages and vice versa).

## Profile UI Changes

**Add a new option** to the `TAX_ACCOUNT_OPTIONS` array:
```text
{ value: 'none', label: "I don't contribute to any of these" }
```

**Mutual exclusion logic** (mirrors the insurance section):
- Selecting "None" clears all other account selections, leaving only `['none']`
- Selecting any specific account clears `'none'` from the array
- This satisfies the existing validation rule ("select at least one") since `['none']` has length > 0

**Update `handleTaxAccountToggle`** to handle the mutual exclusion:
- If user clicks `'none'`: set array to `['none']`
- If user clicks any other account while `'none'` is selected: remove `'none'`, add the clicked account

## Scoring Engine Changes

**Update `calcTax` in `src/lib/rprxScoreEngine.ts`**:

Current logic scores based on array length:
- 0 accounts = 0 pts, 1 = 2 pts, 2 = 3 pts, 3+ = 5 pts

New logic: Filter out `'none'` before counting. If the array contains only `'none'` (or is empty after filtering), the accounts score = 0. Otherwise count as before.

This means choosing "None" gives 0 points for the tax-advantaged accounts sub-score (max 5), which accurately reflects the user's situation.

## Files to Modify

1. **`src/pages/Profile.tsx`**
   - Add `'none'` option to `TAX_ACCOUNT_OPTIONS`
   - Update `handleTaxAccountToggle` with mutual exclusion logic
   - Style the "None" option slightly differently (muted/italic) to visually separate it, same as the insurance "no insurance" option

2. **`src/lib/rprxScoreEngine.ts`**
   - Filter `'none'` from the accounts array before counting in `calcTax`

No database changes needed -- `'none'` is just another string value in the existing jsonb array column.

