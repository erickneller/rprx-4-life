

# Use Profile Data for Assessment Cash Flow (Remove Cash Flow Questions)

## Overview
The assessment currently asks two cash flow questions (income range and expense range) at the end of the wizard. Since the profile now requires all financial fields (monthly_income, monthly_debt_payments, monthly_housing, monthly_insurance, monthly_living_expenses), these questions are redundant. The assessment should pull cash flow data directly from the profile instead.

## What Changes

### 1. Update `useAssessment.ts` -- Use profile data for cash flow
- Import `useProfile` hook
- Remove the logic that looks up cash flow questions by `order_index` (16 and 17)
- Instead, use `calculateCashFlowFromNumbers()` with the profile's actual dollar values to derive `cash_flow_status`
- Store `income_range` and `expense_range` as `null` (or remove them) since we no longer collect ranges
- The scoring engine already skips `cash_flow` category questions, so horseman scores are unaffected

### 2. Delete the two cash flow questions from the database
- Run a migration to delete the two rows from `assessment_questions` where `category = 'cash_flow'` (order_index 16 and 17)
- This reduces the assessment from 17 questions to 15

### 3. Update `cashFlowCalculator.ts` -- No changes needed
- The `calculateCashFlowFromNumbers()` function already exists and accepts exact dollar amounts from the profile. It will be reused in the assessment submission.

## Technical Details

### Database Migration
```sql
DELETE FROM assessment_questions WHERE category = 'cash_flow';
```

### File: `src/hooks/useAssessment.ts`
- Add `import { useProfile } from '@/hooks/useProfile';`
- Add `import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';`
- Inside the hook, call `const { profile } = useProfile();`
- In `submitAssessment`, replace the income/expense question lookup block (lines 82-91) with:
  ```typescript
  const cashFlowResult = profile
    ? calculateCashFlowFromNumbers(
        profile.monthly_income || 0,
        profile.monthly_debt_payments || 0,
        profile.monthly_housing || 0,
        profile.monthly_insurance || 0,
        profile.monthly_living_expenses || 0
      )
    : null;
  ```
- Use `cashFlowResult?.status` for the `cash_flow_status` field in the insert
- Set `income_range: null` and `expense_range: null` (these fields become unused)

### No other file changes needed
- The scoring engine already ignores `cash_flow` category questions
- The results page reads `cash_flow_status` from the assessment record, so it continues to work
- The assessment wizard auto-adjusts to the number of questions returned from the database

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAssessment.ts` | Use profile data instead of question responses for cash flow |
| Database migration | Delete 2 cash flow questions from `assessment_questions` |

