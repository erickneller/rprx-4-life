export type CashFlowStatus = 'surplus' | 'tight' | 'deficit';

export interface RangeOption {
  value: string;
  label: string;
  midpoint: number;
}

const RANGE_MIDPOINTS: Record<string, number> = {
  under_3000: 2000,
  '3000_5000': 4000,
  '5000_7500': 6250,
  '7500_10000': 8750,
  '10000_15000': 12500,
  over_15000: 20000,
};

export function getMidpoint(rangeValue: string): number {
  return RANGE_MIDPOINTS[rangeValue] || 0;
}

export function calculateCashFlowStatus(
  incomeRange: string,
  expenseRange: string
): CashFlowStatus {
  const incomeMidpoint = getMidpoint(incomeRange);
  const expenseMidpoint = getMidpoint(expenseRange);

  if (incomeMidpoint === 0 || expenseMidpoint === 0) {
    return 'tight';
  }

  // Surplus: Income > Expenses + 20%
  if (incomeMidpoint > expenseMidpoint * 1.2) {
    return 'surplus';
  }

  // Deficit: Expenses > Income
  if (expenseMidpoint > incomeMidpoint) {
    return 'deficit';
  }

  // Tight: Everything else
  return 'tight';
}

export function getCashFlowLabel(status: CashFlowStatus): string {
  const labels: Record<CashFlowStatus, string> = {
    surplus: 'Healthy Surplus',
    tight: 'Tight Balance',
    deficit: 'Cash Flow Pressure',
  };
  return labels[status];
}

export function getCashFlowDescription(status: CashFlowStatus): string {
  const descriptions: Record<CashFlowStatus, string> = {
    surplus:
      'Your income comfortably exceeds your expenses, providing flexibility for savings and unexpected needs.',
    tight:
      'Your income and expenses are closely balanced, leaving limited room for unexpected costs or additional savings.',
    deficit:
      'Your expenses currently exceed your income, creating pressure that compounds across other financial areas.',
  };
  return descriptions[status];
}
