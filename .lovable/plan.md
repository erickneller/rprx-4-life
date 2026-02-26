

# Fix: Wizard Saving Display Labels Instead of Values

## Problem

The Profile Wizard saves human-readable labels (e.g., `"Married Filing Jointly"`, `"Not Sure"`, `"Somewhat Confident"`) directly to the database instead of machine-friendly keys (e.g., `"married_jointly"`, `"not_sure"`, `"somewhat_confident"`). This breaks consistency with the rest of the app (Profile page, scoring engines, etc.) which expect specific key values.

## Fix

**File: `src/components/wizard/ProfileWizard.tsx`**

Replace the plain string arrays with value/label pair arrays for all affected fields, then update the Select and OptionCard components to use `value` for storage and `label` for display.

### Changed constants (lines 15-23):

```typescript
const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

const EMPLOYER_MATCH_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'na', label: 'Not Applicable' },
  { value: 'not_sure', label: 'Not Sure' },
];

const FINANCIAL_GOALS = [
  { value: 'reduce_taxes', label: 'Reduce Taxes' },
  { value: 'reduce_debt', label: 'Reduce Debt & Interest' },
  { value: 'reduce_insurance_costs', label: 'Lower Insurance Costs' },
  { value: 'save_for_education', label: 'Education Funding' },
  { value: 'increase_cash_flow', label: 'Increase Cash Flow' },
  { value: 'improve_retirement', label: 'Improve Retirement' },
  { value: 'build_emergency_fund', label: 'Build Emergency Fund' },
];

const STRESS_WORRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
];

const STRESS_CONFIDENCE_OPTIONS = [
  { value: 'not_confident', label: 'Not Confident' },
  { value: 'somewhat_confident', label: 'Somewhat Confident' },
  { value: 'very_confident', label: 'Very Confident' },
  { value: 'completely_confident', label: 'Completely Confident' },
];

const STRESS_CONTROL_OPTIONS = [
  { value: 'not_at_all', label: 'Not at All' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'completely', label: 'Completely' },
];
```

### Updated UI references:

- **Filing status Select** (line 266): `SelectItem` uses `value={s.value}` and displays `s.label`
- **Employer match Select** (line 274): Same pattern
- **Financial goals checkboxes** (line 321-334): Check/toggle by `goal.value`, display `goal.label`
- **Stress OptionCards** (lines 355-380): Pass `value` for selection state, display `label`

### No other files change

The display stays identical to the user. Only the stored values change to match what the rest of the system expects.

