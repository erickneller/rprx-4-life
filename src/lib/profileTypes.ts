// Profile type options for user categorization
export const PROFILE_TYPES = [
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'retiree', label: 'Retiree / Grandparent' },
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'wage_earner', label: 'Wage Earner' },
  { value: 'investor', label: 'Investor' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'nonprofit', label: 'Non-Profit' },
] as const;

// Financial goals for multi-select
export const FINANCIAL_GOALS = [
  { value: 'increase_cash_flow', label: 'Increase Cash Flow' },
  { value: 'reduce_taxes', label: 'Reduce Taxes' },
  { value: 'save_for_education', label: 'Save for Education' },
  { value: 'improve_retirement', label: 'Improve Retirement' },
  { value: 'reduce_insurance_costs', label: 'Reduce Insurance Costs' },
  { value: 'large_purchase', label: 'Large Purchase or Investment' },
] as const;

// Filing status options
export const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
  { value: 'qualifying_surviving_spouse', label: 'Qualifying Surviving Spouse' },
] as const;

// Type exports
export type ProfileType = typeof PROFILE_TYPES[number]['value'];
export type FilingStatus = typeof FILING_STATUSES[number]['value'];
export type FinancialGoal = typeof FINANCIAL_GOALS[number]['value'];

// Helper to get label from value
export function getProfileTypeLabel(value: string | string[] | null): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const labels = value.map(v => PROFILE_TYPES.find(t => t.value === v)?.label).filter(Boolean);
    return labels.length > 0 ? labels.join(', ') : null;
  }
  return PROFILE_TYPES.find(t => t.value === value)?.label ?? null;
}

export function getFinancialGoalLabels(values: string[] | null): string[] {
  if (!values || values.length === 0) return [];
  const labels: string[] = [];
  for (const v of values) {
    const goal = FINANCIAL_GOALS.find(g => g.value === v);
    if (goal) labels.push(goal.label);
  }
  return labels;
}
