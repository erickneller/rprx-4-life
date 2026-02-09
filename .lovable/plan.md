

# Target Payoff Goal, Cash Flow Gap, and Strategy Prompt

## Overview
Add an inline "Target Payoff Goal" section to the Focus Debt Card that lets users set a payoff timeline (in months), then shows the required monthly payment, extra needed beyond minimum, and whether their cash flow supports it. Includes a status badge and actionable copy.

## What the User Will See

The Focus Debt Card gets a new section between the recommendation box and the progress bar:

```text
+--------------------------------------------------+
| (target) Your Focus                 [Attack Mode] |
|                                                   |
| Amex                              Credit Card     |
| $ $2,400 remaining    28% APR                     |
|                                                   |
| [Recommendation reason box]                       |
|                                                   |
| --- Target Payoff Goal ---                        |
| Pay off in: [6] months              [On Track] *  |
|                                                   |
| Required:     $400/mo                             |
| Minimum:      $75/mo                              |
| Extra needed: $325/mo                             |
| Your surplus: $850/mo                             |
|                                                   |
| "Your current cash flow supports this goal."      |
|                                                   |
| --- Progress ---                                  |
| 0% paid off                       ~6 months       |
+--------------------------------------------------+
```

*Badge is color-coded: green (On Track), yellow (Tight), red (Gap).

### Status Variants

**On Track** (surplus >= extra needed):
> "Your current cash flow supports this goal."

**Tight** (surplus > 0 but < extra needed):
> "You're close. A small adjustment can get you there."

**Gap** (surplus <= 0 or gap > 0):
> "You'll need to free up $X/mo to hit this goal."

## Technical Details

### 1. New Component: `TargetPayoffSection.tsx`

Location: `src/components/debt-eliminator/dashboard/TargetPayoffSection.tsx`

**Props:**
```typescript
interface TargetPayoffSectionProps {
  focusDebt: UserDebt;
  monthlySurplus: number | null;
  targetMonths: number;
  onTargetMonthsChange: (months: number) => void;
}
```

**Calculations (all inline, no interest amortization):**
- `requiredPayment = currentBalance / targetMonths`
- `extraNeeded = max(0, requiredPayment - minPayment)`
- `cashFlowGap = max(0, extraNeeded - surplus)`
- Status: On Track / Tight / Gap based on surplus vs extra needed

**Default target months** (system-suggested):
- If surplus > 0: `ceil(balance / (minPayment + surplus))`
- Else: 12 months

**Input:** Number input (1-36 range), with the default pre-filled.

### 2. State Management

Target months will be stored as local component state in `FocusDebtCard` (not persisted to DB for MVP). When the focus debt changes, the default recalculates.

### 3. Modify `FocusDebtCard.tsx`

- Add `monthlySurplus: number | null` prop
- Add local `targetMonths` state with computed default via `useMemo`
- Render `<TargetPayoffSection>` between the recommendation box and the progress section
- Reset `targetMonths` when `focusDebt.id` changes (via `useEffect`)

### 4. Update `DebtDashboard.tsx`

- Pass `monthlySurplus` to `FocusDebtCard`

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/debt-eliminator/dashboard/TargetPayoffSection.tsx` | Inline section showing target timeline, required payment, gap analysis, and status badge |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/debt-eliminator/dashboard/FocusDebtCard.tsx` | Add `monthlySurplus` prop, local `targetMonths` state with smart default, render `TargetPayoffSection` |
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Pass `monthlySurplus` to `FocusDebtCard` |

## Scope Boundaries

- No interest amortization -- simple `balance / months`
- No database persistence for target months (local state only, MVP)
- No strategy prompt integration yet (can be added as follow-up)
- Stabilize mode: section hidden or shows read-only message ("Stabilize your cash flow first")

