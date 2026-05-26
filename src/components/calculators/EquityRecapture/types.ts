// Equity Recapture Calculator — Type definitions
// Mirrors the spreadsheet EQUITYRECAPTURE tab inputs and outputs.

export interface EquityRecaptureInputs {
  loanAmount: number;          // USD
  annualInterestRate: number;  // decimal, e.g. 0.065 for 6.5%
  termMonths: number;          // 360 for 30yr, 180 for 15yr, etc.
  extraMonthlyPayment: number; // USD
  extraAnnualPayment: number;  // USD
  annualPaymentMonth: number;  // 1-12 (month of year the annual extra hits)
}

export interface ScheduleRow {
  month: number;            // 1, 2, 3...
  interest: number;         // interest accrued this month
  principalPaid: number;    // amount applied to principal
  extraMonthly: number;     // extra monthly applied this month
  extraAnnual: number;      // extra annual applied this month (only on annual month)
  totalPayment: number;     // scheduled P&I + extras
  balance: number;          // remaining balance after this payment
}

export interface ScenarioResult {
  monthsToPayoff: number;
  yearsToPayoff: number;
  totalInterest: number;
  totalPayments: number;
  totalExtraPayments: number;
  schedule: ScheduleRow[];
}

export interface EquityRecaptureOutputs {
  monthlyPayment: number;        // standard P&I, no extras
  accelerated: ScenarioResult;
  baseline: ScenarioResult;
  interestSavings: number;       // baseline.totalInterest - accelerated.totalInterest
  yearsSaved: number;            // baseline.years - accelerated.years
}

// Persisted record in Supabase
export interface SavedRun {
  id: string;
  user_id: string;
  calculator_type: 'equity_recapture';
  run_name: string;
  inputs: EquityRecaptureInputs;
  outputs: EquityRecaptureOutputs;
  notes?: string;
  created_at: string;
  updated_at: string;
}
