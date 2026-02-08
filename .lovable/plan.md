

# Focus Debt Recommendation System

## Overview
Implement a "Focus Debt" recommendation engine that helps users prioritize which debt to attack first, while allowing them to list and track multiple debts. The system will use cash flow data to make intelligent recommendations and explain the reasoning transparently.

## Core Principles
1. **One focus debt at a time** - Preserves the "hope loop" for adherence
2. **Smart recommendations** - Based on quick-win logic with high-APR guardrails
3. **Transparent reasoning** - Always explain why a debt is recommended
4. **User control** - Allow override with a different focus if they prefer
5. **Profile sync** - Cash flow data captured in wizard syncs to user profile

---

## Implementation Components

### Phase 1: Cash Flow Capture in Setup Wizard

#### New Step: CashFlowStep
Insert between "Debts" and "Dream" steps:
- **Title**: "What's your monthly cash flow?"
- **Fields**: Net Monthly Income (required) + optional expense breakdown
- **Live calculation**: Shows estimated monthly surplus
- **Pre-fill**: If profile already has cash flow data, pre-populate fields
- **Sync**: On wizard completion, save to `profiles` table as well

**Wizard Flow Update**:
```
welcome → goals → debts → cashflow → dream
```

### Phase 2: Recommendation Engine

#### New File: `src/lib/debtRecommendationEngine.ts`

**Algorithm Logic**:

```text
INPUT: debts[], monthlySurplus

STEP 1: Filter out paid-off debts

STEP 2: Check cash flow status
  IF surplus <= 0:
    → Mode: "stabilize"
    → Recommend: Highest APR as "watch debt"
    → Action: "Pay minimums only, stabilize cash flow first"
    
STEP 3: If surplus > 0
  → Mode: "attack"
  
  3a. Check for very high APR (≥18%)
    IF any debt has APR ≥ 18%:
      → Recommend highest APR debt
      → Reason: "This debt is costing you the most each month"
  
  3b. Find quick wins (payoff within 6 months using surplus + min_payment)
    Calculate: months_to_payoff = current_balance / (min_payment + surplus)
    IF any debt can be paid off in ≤ 6 months (excluding mortgage):
      → Recommend smallest of those (fastest win)
      → Reason: "You can eliminate this in ~X months and free up $Y/month"
  
  3c. Fallback: Highest APR
    → Recommend highest APR debt
    → Reason: "Focus here to minimize interest costs"

OUTPUT: {
  focusDebt: UserDebt,
  mode: 'stabilize' | 'attack',
  reason: string,
  estimatedPayoffMonths?: number,
  freedPayment?: number,
  rankedDebts: { debt: UserDebt, rank: number, reason: string }[]
}
```

**Mortgage Guardrail**: Exclude mortgages from "quick win" consideration unless it's the only debt.

### Phase 3: Database Changes

#### Add to `debt_journeys` table:
- `focus_debt_id` (uuid, nullable, FK to user_debts) - User's chosen focus debt
- `monthly_surplus` (numeric, nullable) - Cached for quick calculations

#### Update `SetupWizardData` type:
Add cash flow fields to sync with profile on completion.

### Phase 4: Dashboard UI Updates

#### New Component: FocusDebtCard
Prominent card at top of debt list showing:
- **Recommended focus debt** with explanation
- **Mode indicator**: "Attack Mode" (green) or "Stabilize Mode" (yellow)
- **Progress ring** for the focus debt specifically
- **"Log Payment" button** - primary action
- **"Change Focus" button** - opens override dialog

#### Ranked Debt List
Below the focus card, show remaining debts with rank badges:
- **#1, #2, #3...** indicating the recommended order
- Each shows a one-line reason
- User can click to set as focus (override)

#### Override Dialog
When user picks a different focus:
- Show: "We recommended [X] because [reason]. Are you sure you want to focus on [Y] instead?"
- Options: "Keep [X]" or "Switch to [Y]"
- No judgment - just confirmation

### Phase 5: Profile Sync

On wizard completion:
1. Create journey with debts
2. Run recommendation engine to set initial `focus_debt_id`
3. Sync cash flow data to `profiles` table (if user doesn't already have it)

If user later updates profile cash flow, recalculate recommendation.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/debtRecommendationEngine.ts` | Core algorithm for focus debt selection |
| `src/components/debt-eliminator/setup/CashFlowStep.tsx` | Wizard step for cash flow capture |
| `src/components/debt-eliminator/dashboard/FocusDebtCard.tsx` | Prominent focus debt display |
| `src/components/debt-eliminator/dashboard/ChangeFocusDialog.tsx` | Override confirmation dialog |
| `src/components/debt-eliminator/dashboard/RankedDebtList.tsx` | Ordered debt list with explanations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/debt-eliminator/setup/SetupWizard.tsx` | Add cash flow step, update flow |
| `src/lib/debtTypes.ts` | Add `SetupWizardData` cash flow fields, recommendation types |
| `src/hooks/useDebtJourney.ts` | Add profile sync, focus debt mutations |
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Integrate FocusDebtCard, RankedDebtList |
| `src/components/debt-eliminator/dashboard/DebtCard.tsx` | Add rank badge, focus indicator |

## Database Migration

```sql
-- Add focus debt tracking to journeys
ALTER TABLE debt_journeys 
  ADD COLUMN focus_debt_id uuid REFERENCES user_debts(id) ON DELETE SET NULL,
  ADD COLUMN monthly_surplus numeric;
```

---

## User Experience Flow

### During Setup
```text
1. User enters debts with balances, APRs, min payments
2. User enters cash flow (income, expenses)
   → Live shows: "Your monthly surplus is $X"
3. User enters dream
4. Wizard completes → System auto-selects focus debt
```

### On Dashboard
```text
+--------------------------------------------------+
| 🎯 YOUR FOCUS: Chase Visa                        |
| $2,340 remaining at 24.99% APR                   |
|                                                  |
| "Focus here because it has the highest interest  |
|  and costs you the most each month."             |
|                                                  |
| [==========-------] 58% paid                     |
|                                                  |
| [ Log Payment ]           [ Change Focus ]       |
+--------------------------------------------------+

| Recommended Order                                |
| #2 Car Loan - Quick win (~4 months with surplus) |
| #3 Student Loan - Lower rate, tackle after       |
| #4 Mortgage - Long-term, lowest priority         |
+--------------------------------------------------+
```

### Stabilize Mode (Deficit)
```text
+--------------------------------------------------+
| ⚠️ STABILIZE MODE                                |
| Your expenses currently exceed your income.      |
|                                                  |
| 👁️ Watch: Chase Visa (24.99% APR)                |
| This is your highest-interest debt.              |
|                                                  |
| Action: Pay minimums only while you stabilize.   |
| [ Review Cash Flow Tips ]                        |
+--------------------------------------------------+
```

---

## Technical Details

### Recommendation Types
```typescript
interface DebtRecommendation {
  focusDebtId: string;
  mode: 'attack' | 'stabilize';
  reason: string;
  estimatedPayoffMonths?: number;
  freedPayment?: number;
}

interface RankedDebt {
  debt: UserDebt;
  rank: number;
  reason: string;
  isRecommendedFocus: boolean;
  isFocusOverride: boolean;
}

interface RecommendationResult {
  recommendation: DebtRecommendation;
  rankedDebts: RankedDebt[];
}
```

### Algorithm Constants
```typescript
const HIGH_APR_THRESHOLD = 18; // % - credit card territory
const QUICK_WIN_MAX_MONTHS = 6;
const DEPRIORITIZE_TYPES: DebtType[] = ['mortgage'];
```

### Cash Flow Step Integration
- Reuse `CurrencyInput` component from profile
- Pre-fill from profile if data exists
- On submit, update wizard data AND profile in single transaction

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No surplus data | Prompt to enter, but allow skip (defaults to highest APR) |
| All debts paid off | Show celebration, no focus card |
| Only one debt | That debt is automatically the focus |
| User deletes focus debt | Auto-select next recommendation |
| Mortgage is only debt | It becomes focus despite type |
| Tied APRs | Use smaller balance as tiebreaker |

