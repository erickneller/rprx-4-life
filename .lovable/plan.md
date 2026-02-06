

# Simple Cash Flow Profile - Implementation Plan

## Overview
Replace the range-based cash flow approach with simple dollar inputs stored in the user profile. This gives accurate cash flow calculations with minimal friction - just 5 numbers.

---

## Input Fields

| Field | Type | Description |
|-------|------|-------------|
| `monthly_income` | numeric | Net monthly income (take-home pay) |
| `monthly_debt_payments` | numeric | Total monthly debt minimums |
| `monthly_housing` | numeric | Rent or mortgage payment |
| `monthly_insurance` | numeric | Combined insurance costs |
| `monthly_living_expenses` | numeric | Food, gas, utilities, subscriptions (estimated) |

**Calculated Values:**
- **Total Expenses** = debt_payments + housing + insurance + living_expenses
- **Monthly Surplus/Deficit** = income - total_expenses
- **Cash Flow Status** = surplus / tight / deficit (based on ratio)

---

## Implementation Steps

### Phase 1: Database Migration
Add 5 new nullable numeric columns to the `profiles` table.

### Phase 2: Update Profile Hook & Types
Extend the `Profile` interface and update the `useProfile` hook to include new fields.

### Phase 3: Update Profile Edit Modal
Add a "Cash Flow" section with simple number inputs:
- Currency-formatted inputs (shows $)
- Helper text for each field
- Live calculation preview showing surplus/deficit

### Phase 4: Update Cash Flow Calculator
Refactor `cashFlowCalculator.ts` to work with actual numbers instead of ranges:
- New function: `calculateCashFlowFromNumbers()`
- Backward compatibility with existing range-based assessment data

### Phase 5: Strategy Assistant Integration
Update the edge function to include profile cash flow data in the system prompt.

---

## Database Schema Change

```sql
ALTER TABLE profiles ADD COLUMN monthly_income numeric;
ALTER TABLE profiles ADD COLUMN monthly_debt_payments numeric;
ALTER TABLE profiles ADD COLUMN monthly_housing numeric;
ALTER TABLE profiles ADD COLUMN monthly_insurance numeric;
ALTER TABLE profiles ADD COLUMN monthly_living_expenses numeric;
```

---

## Profile Edit Modal UI

```
┌─────────────────────────────────────────────────────┐
│ Edit Profile                                   [X]  │
├─────────────────────────────────────────────────────┤
│ [Avatar]                                            │
│ Full Name: _______________                          │
│ Email: user@email.com (disabled)                    │
│ Phone: _______________                              │
│ Company: _______________                            │
├─────────────────────────────────────────────────────┤
│ Cash Flow Snapshot (optional)                       │
│ Help us personalize your experience                 │
│                                                     │
│ Net Monthly Income                                  │
│ $ [__________]                                      │
│ Your take-home pay after taxes                      │
│                                                     │
│ Monthly Fixed Obligations                           │
│                                                     │
│ Debt Payments            Housing                    │
│ $ [________]             $ [________]               │
│ Total minimums           Rent/mortgage              │
│                                                     │
│ Insurance                                           │
│ $ [________]                                        │
│ All insurance combined                              │
│                                                     │
│ Monthly Living Expenses                             │
│ $ [________]                                        │
│ Food, gas, utilities, subscriptions (estimate)      │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Monthly Surplus: $1,200                         │ │
│ │ Status: Healthy Surplus ↑                       │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│               [Cancel]  [Save Changes]              │
└─────────────────────────────────────────────────────┘
```

---

## File Changes

### Database
- **Migration**: Add 5 numeric columns to `profiles`

### Frontend
| File | Changes |
|------|---------|
| `src/hooks/useProfile.ts` | Add 5 new fields to Profile interface |
| `src/components/profile/ProfileEditModal.tsx` | Add Cash Flow section with inputs and live preview |
| `src/lib/cashFlowCalculator.ts` | Add `calculateCashFlowFromNumbers()` function |
| `src/components/ui/currency-input.tsx` (new) | Optional: Reusable currency input component |

### Edge Function
| File | Changes |
|------|---------|
| `supabase/functions/rprx-chat/index.ts` | Fetch profile data, inject cash flow context into system prompt |

---

## Cash Flow Calculator Updates

```typescript
// New function for actual numbers
export function calculateCashFlowFromNumbers(
  income: number,
  debtPayments: number,
  housing: number,
  insurance: number,
  livingExpenses: number
): { status: CashFlowStatus; surplus: number; totalExpenses: number } {
  const totalExpenses = debtPayments + housing + insurance + livingExpenses;
  const surplus = income - totalExpenses;
  const ratio = totalExpenses > 0 ? income / totalExpenses : 1;

  let status: CashFlowStatus;
  if (ratio > 1.2) {
    status = 'surplus';
  } else if (ratio < 1) {
    status = 'deficit';
  } else {
    status = 'tight';
  }

  return { status, surplus, totalExpenses };
}
```

---

## Strategy Assistant Integration

The edge function will include profile cash flow in the system prompt:

```text
## USER FINANCIAL PROFILE
Monthly Income: $8,500
Monthly Expenses: $6,800
  - Debt Payments: $1,200
  - Housing: $2,400
  - Insurance: $500
  - Living Expenses: $2,700
Monthly Surplus: $1,700
Cash Flow Status: Healthy Surplus

Use this information to tailor recommendations. Do NOT ask about income or expenses.
```

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Accurate | Real numbers instead of range midpoint estimates |
| Simple | Only 5 inputs, no categories or line items |
| Fast | Takes 30 seconds to fill out |
| Reusable | Same data used across assessment, strategy assistant, debt eliminator |
| Personalized | Strategy Assistant skips income/expense questions |

---

## Technical Considerations

1. **Currency Input Formatting**: Use `Intl.NumberFormat` for display, store raw numbers in database
2. **Validation**: All fields optional but show warning if partially filled
3. **Backward Compatibility**: Assessment still works with ranges; profile data takes priority when available
4. **Privacy**: Cash flow data protected by existing profile RLS policies

