

# Improve Focus Debt Card Override Messaging

## Problem
When the user overrides the recommended focus debt, the card currently shows the **engine's recommendation reason** which references the recommended debt's APR — not the user's chosen debt. This creates confusing mismatches (e.g., showing "28% APR" when the chosen debt is 15% APR). The override note is also too subtle.

## Solution
Split the recommendation box into two distinct messages when overridden:

1. **"Our Recommendation"** line — bold, showing the recommended debt name and why (using the engine's reason)
2. The user's chosen debt info is already shown in the card header, so no duplication needed

When there's **no override**, keep the current behavior showing the recommendation reason normally.

## Changes

### 1. Pass the recommended debt to FocusDebtCard
In `DebtDashboard.tsx`, find the recommended debt object and pass it as a new prop so the card can reference its name.

### 2. Update FocusDebtCard messaging
When `isOverride` is true, replace the current recommendation box content with:

```
Recommendation: Focus on [RECOMMENDED DEBT NAME] because it has the
highest interest (XX% APR) and costs you the most each month.
```

This line will be **bold** to draw attention. The user's chosen debt name/details are already displayed above in the card header, making the contrast clear.

When `isOverride` is false, show the recommendation reason as-is (current behavior, no changes).

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Find recommended debt object, pass as `recommendedDebt` prop to `FocusDebtCard` |
| `src/components/debt-eliminator/dashboard/FocusDebtCard.tsx` | Add `recommendedDebt` prop; when `isOverride`, show bold recommendation line with recommended debt name and reason; when not overridden, show reason as-is |

## Updated UI (Override State)

```text
+--------------------------------------------------+
| (target) Your Focus                 [Attack Mode] |
|                                                   |
| Amex                              Credit Card     |
| $ $500 remaining    15% APR                       |
|                                                   |
| +-----------------------------------------------+ |
| | Recommendation: Focus on Chase Visa because   | |
| | it has the highest interest (28% APR) and      | |
| | costs you the most each month.                 | |
| +-----------------------------------------------+ |
|                                                   |
| 0% paid off                       ~12 months      |
| [==============================]                  |
|                                                   |
| [ $ Log Payment ]           [ Change Focus ]      |
+---------------------------------------------------+
```

## Technical Details

- Add optional `recommendedDebt?: UserDebt` prop to `FocusDebtCardProps`
- When `isOverride && recommendedDebt`: show "Recommendation: Focus on {recommendedDebt.name} {recommendation.reason}" in bold/semi-bold styling
- When not overridden: show `recommendation.reason` as current (no change)
- Remove the old italic "You chose to focus on this debt instead of our recommendation" text since the bold recommendation line already makes this clear

