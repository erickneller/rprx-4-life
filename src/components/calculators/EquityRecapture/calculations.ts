// Equity Recapture Calculator — Pure math
// These functions have no React dependencies and are independently testable.
// They mirror the Python reference implementation which was verified against
// the source spreadsheet to the penny.

import type {
  EquityRecaptureInputs,
  EquityRecaptureOutputs,
  ScenarioResult,
  ScheduleRow,
} from './types';

const SAFETY_CAP_MONTHS = 600; // 50 years — should never hit this

/**
 * Standard mortgage P&I payment (monthly).
 * Equivalent to Excel's PMT(rate/12, nper, principal) returned as a positive number.
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  const r = annualRate / 12;
  return (
    (principal * (r * Math.pow(1 + r, termMonths))) /
    (Math.pow(1 + r, termMonths) - 1)
  );
}

/**
 * Run a month-by-month amortization. Returns the full schedule plus summary metrics.
 *
 * Implementation matches the spreadsheet's EQUITYRECAPTURE tab logic:
 *   - Interest = balance × rate/12 (equivalent to 30/360 day-count used in XLS)
 *   - Annual extra hits only in the month-of-year specified
 *   - Final payment is clipped to whatever is needed (prevents overpayment)
 *   - Schedule stops once balance drops below $1 (rounded to 0)
 */
export function amortize(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthly: number,
  extraAnnual: number,
  annualPaymentMonth: number,
): ScenarioResult {
  const r = annualRate / 12;
  const scheduledPmt = monthlyPayment(principal, annualRate, termMonths);

  let balance = principal;
  let totalInterest = 0;
  const schedule: ScheduleRow[] = [];

  for (let month = 1; month <= SAFETY_CAP_MONTHS; month++) {
    if (balance < 1) break;

    const interest = balance * r;

    // Annual extra hits only in the designated month-of-year
    const monthOfYear = ((month - 1) % 12) + 1;
    const extraA = monthOfYear === annualPaymentMonth ? extraAnnual : 0;
    const extraM = extraMonthly;

    // On the final scheduled month, pay only what's needed (not the full P&I)
    let scheduledThisMonth: number;
    if (balance - scheduledPmt < 1) {
      scheduledThisMonth = balance + interest;
    } else {
      scheduledThisMonth = scheduledPmt;
    }

    let totalPaymentThisMonth = scheduledThisMonth + extraM + extraA;
    let principalPaid = totalPaymentThisMonth - interest;

    // Cap principal at remaining balance — never overpay
    if (principalPaid >= balance) {
      principalPaid = balance;
      totalPaymentThisMonth = principalPaid + interest;
    }

    balance -= principalPaid;
    totalInterest += interest;

    schedule.push({
      month,
      interest,
      principalPaid,
      extraMonthly: extraM,
      extraAnnual: extraA,
      totalPayment: totalPaymentThisMonth,
      balance,
    });

    if (balance < 1) {
      balance = 0;
      break;
    }
  }

  const months = schedule.length;
  const totalPayments = schedule.reduce((s, r) => s + r.totalPayment, 0);
  const totalExtraPayments = schedule.reduce(
    (s, r) => s + r.extraMonthly + r.extraAnnual,
    0,
  );

  return {
    monthsToPayoff: months,
    yearsToPayoff: Math.round((months / 12) * 100) / 100,
    totalInterest,
    totalPayments,
    totalExtraPayments,
    schedule,
  };
}

/**
 * Main calculation: runs both accelerated and baseline scenarios and returns the comparison.
 */
export function calculateEquityRecapture(
  inputs: EquityRecaptureInputs,
): EquityRecaptureOutputs {
  const mPmt = monthlyPayment(
    inputs.loanAmount,
    inputs.annualInterestRate,
    inputs.termMonths,
  );

  const accelerated = amortize(
    inputs.loanAmount,
    inputs.annualInterestRate,
    inputs.termMonths,
    inputs.extraMonthlyPayment,
    inputs.extraAnnualPayment,
    inputs.annualPaymentMonth,
  );

  const baseline = amortize(
    inputs.loanAmount,
    inputs.annualInterestRate,
    inputs.termMonths,
    0,
    0,
    1,
  );

  const interestSavings = Math.max(
    0,
    baseline.totalInterest - accelerated.totalInterest,
  );
  const yearsSaved = baseline.yearsToPayoff - accelerated.yearsToPayoff;

  return {
    monthlyPayment: mPmt,
    accelerated,
    baseline,
    interestSavings,
    yearsSaved: Math.round(yearsSaved * 100) / 100,
  };
}

/**
 * Sample the schedule at year boundaries for charting.
 * Returns one balance reading per year (month 12, 24, 36...) plus the start (month 0).
 */
export function sampleByYear(
  schedule: ScheduleRow[],
  initialBalance: number,
): Array<{ year: number; balance: number }> {
  const samples: Array<{ year: number; balance: number }> = [
    { year: 0, balance: initialBalance },
  ];
  for (const row of schedule) {
    if (row.month % 12 === 0) {
      samples.push({ year: row.month / 12, balance: row.balance });
    }
  }
  // Always include the final payment month if it didn't land on a year boundary
  const last = schedule[schedule.length - 1];
  if (last && last.month % 12 !== 0) {
    samples.push({
      year: Math.round((last.month / 12) * 100) / 100,
      balance: last.balance,
    });
  }
  return samples;
}

// ---------- Formatting helpers ----------

export function formatCurrency(n: number, withCents = false): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  });
}

export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(2)}%`;
}

export function formatYears(years: number): string {
  if (years === 0) return '0 years';
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  if (months === 0) return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
  if (wholeYears === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
  return `${wholeYears} yr ${months} mo`;
}
