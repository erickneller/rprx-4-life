import type { UserDebt, DebtType } from "./debtTypes";

// Algorithm constants
const HIGH_APR_THRESHOLD = 18; // % - credit card territory
const QUICK_WIN_MAX_MONTHS = 6;
const DEPRIORITIZE_TYPES: DebtType[] = ["mortgage"];

export type RecommendationMode = "attack" | "stabilize";

export interface DebtRecommendation {
  focusDebtId: string;
  mode: RecommendationMode;
  reason: string;
  estimatedPayoffMonths?: number;
  freedPayment?: number;
}

export interface RankedDebt {
  debt: UserDebt;
  rank: number;
  reason: string;
  isRecommendedFocus: boolean;
  estimatedPayoffMonths?: number;
}

export interface RecommendationResult {
  recommendation: DebtRecommendation | null;
  rankedDebts: RankedDebt[];
}

/**
 * Calculate months to pay off a debt given a monthly payment amount
 */
function calculatePayoffMonths(balance: number, monthlyPayment: number): number {
  if (monthlyPayment <= 0 || balance <= 0) return Infinity;
  return Math.ceil(balance / monthlyPayment);
}

/**
 * Sort debts by APR (descending) with balance as tiebreaker (ascending)
 */
function sortByAprThenBalance(a: UserDebt, b: UserDebt): number {
  if (b.interest_rate !== a.interest_rate) {
    return b.interest_rate - a.interest_rate;
  }
  return a.current_balance - b.current_balance;
}

/**
 * Get the highest APR debt from a list
 */
function getHighestAprDebt(debts: UserDebt[]): UserDebt | null {
  if (debts.length === 0) return null;
  return [...debts].sort(sortByAprThenBalance)[0];
}

/**
 * Check if a debt is a deprioritized type (e.g., mortgage)
 */
function isDeprioritizedType(debt: UserDebt): boolean {
  return DEPRIORITIZE_TYPES.includes(debt.debt_type);
}

/**
 * Find quick win debts that can be paid off within the threshold months
 */
function findQuickWins(
  debts: UserDebt[],
  monthlySurplus: number
): { debt: UserDebt; months: number }[] {
  return debts
    .filter((debt) => !isDeprioritizedType(debt))
    .map((debt) => {
      const monthlyPayment = debt.min_payment + monthlySurplus;
      const months = calculatePayoffMonths(debt.current_balance, monthlyPayment);
      return { debt, months };
    })
    .filter(({ months }) => months <= QUICK_WIN_MAX_MONTHS)
    .sort((a, b) => a.months - b.months); // Fastest wins first
}

/**
 * Generate reason text for a debt recommendation
 */
function generateReason(
  debt: UserDebt,
  mode: RecommendationMode,
  payoffMonths?: number
): string {
  if (mode === "stabilize") {
    return `This has the highest interest rate (${debt.interest_rate}% APR). Pay minimums while you stabilize your cash flow.`;
  }

  if (debt.interest_rate >= HIGH_APR_THRESHOLD) {
    return `It has the highest interest (${debt.interest_rate}% APR) and costs you the most each month.`;
  }

  if (payoffMonths && payoffMonths <= QUICK_WIN_MAX_MONTHS) {
    return `You can eliminate this in ~${payoffMonths} months and free up $${debt.min_payment}/month.`;
  }

  return `It has the highest interest rate (${debt.interest_rate}% APR), so tackling it first minimizes your total interest costs.`;
}

/**
 * Generate ranked list reason for non-focus debts
 */
function generateRankReason(
  debt: UserDebt,
  rank: number,
  monthlySurplus: number
): string {
  if (isDeprioritizedType(debt)) {
    return "Long-term, lower priority";
  }

  const monthlyPayment = debt.min_payment + monthlySurplus;
  const months = calculatePayoffMonths(debt.current_balance, monthlyPayment);

  if (months <= QUICK_WIN_MAX_MONTHS) {
    return `Quick win (~${months} months with surplus)`;
  }

  if (debt.interest_rate >= HIGH_APR_THRESHOLD) {
    return `High interest (${debt.interest_rate}% APR)`;
  }

  return `Lower rate, tackle after focus debt`;
}

/**
 * Main recommendation engine
 * 
 * Algorithm:
 * 1. Filter out paid-off debts
 * 2. If surplus <= 0: Stabilize mode - recommend highest APR as "watch debt"
 * 3. If surplus > 0: Attack mode
 *    a. If any debt has APR >= 18%, recommend highest APR
 *    b. Otherwise, find quick wins (payoff in <= 6 months)
 *    c. Fallback: highest APR
 */
export function getDebtRecommendation(
  debts: UserDebt[],
  monthlySurplus: number | null | undefined
): RecommendationResult {
  // Filter out paid-off debts
  const activeDebts = debts.filter(
    (debt) => debt.current_balance > 0 && !debt.paid_off_at
  );

  // No active debts
  if (activeDebts.length === 0) {
    return { recommendation: null, rankedDebts: [] };
  }

  const surplus = monthlySurplus ?? 0;
  const highestAprDebt = getHighestAprDebt(activeDebts)!;

  // STABILIZE MODE: No surplus to attack with
  if (surplus <= 0) {
    const recommendation: DebtRecommendation = {
      focusDebtId: highestAprDebt.id,
      mode: "stabilize",
      reason: generateReason(highestAprDebt, "stabilize"),
    };

    // Rank all debts by APR
    const rankedDebts: RankedDebt[] = [...activeDebts]
      .sort(sortByAprThenBalance)
      .map((debt, index) => ({
        debt,
        rank: index + 1,
        reason: index === 0 
          ? "Watch this debt - highest interest" 
          : generateRankReason(debt, index + 1, surplus),
        isRecommendedFocus: debt.id === highestAprDebt.id,
      }));

    return { recommendation, rankedDebts };
  }

  // ATTACK MODE: Has surplus to throw at debt
  let focusDebt: UserDebt;
  let focusReason: string;
  let estimatedPayoffMonths: number | undefined;

  // Check for very high APR debts first
  const highAprDebts = activeDebts.filter(
    (d) => d.interest_rate >= HIGH_APR_THRESHOLD
  );

  if (highAprDebts.length > 0) {
    // Prioritize highest APR
    focusDebt = getHighestAprDebt(highAprDebts)!;
    const monthlyPayment = focusDebt.min_payment + surplus;
    estimatedPayoffMonths = calculatePayoffMonths(
      focusDebt.current_balance,
      monthlyPayment
    );
    focusReason = generateReason(focusDebt, "attack", estimatedPayoffMonths);
  } else {
    // Look for quick wins
    const quickWins = findQuickWins(activeDebts, surplus);

    if (quickWins.length > 0) {
      // Take the fastest quick win
      const fastest = quickWins[0];
      focusDebt = fastest.debt;
      estimatedPayoffMonths = fastest.months;
      focusReason = generateReason(focusDebt, "attack", estimatedPayoffMonths);
    } else {
      // Fallback: highest APR
      focusDebt = highestAprDebt;
      const monthlyPayment = focusDebt.min_payment + surplus;
      estimatedPayoffMonths = calculatePayoffMonths(
        focusDebt.current_balance,
        monthlyPayment
      );
      focusReason = generateReason(focusDebt, "attack", estimatedPayoffMonths);
    }
  }

  const recommendation: DebtRecommendation = {
    focusDebtId: focusDebt.id,
    mode: "attack",
    reason: focusReason,
    estimatedPayoffMonths,
    freedPayment: focusDebt.min_payment,
  };

  // Build ranked list
  // Sort by: focus debt first, then by APR (descending), with mortgages last
  const sortedDebts = [...activeDebts].sort((a, b) => {
    // Focus debt always first
    if (a.id === focusDebt.id) return -1;
    if (b.id === focusDebt.id) return 1;

    // Mortgages last
    const aIsMortgage = isDeprioritizedType(a);
    const bIsMortgage = isDeprioritizedType(b);
    if (aIsMortgage && !bIsMortgage) return 1;
    if (!aIsMortgage && bIsMortgage) return -1;

    // Then by APR
    return sortByAprThenBalance(a, b);
  });

  const rankedDebts: RankedDebt[] = sortedDebts.map((debt, index) => {
    const monthlyPayment = debt.min_payment + surplus;
    const months = calculatePayoffMonths(debt.current_balance, monthlyPayment);

    return {
      debt,
      rank: index + 1,
      reason:
        debt.id === focusDebt.id
          ? focusReason
          : generateRankReason(debt, index + 1, surplus),
      isRecommendedFocus: debt.id === focusDebt.id,
      estimatedPayoffMonths: months === Infinity ? undefined : months,
    };
  });

  return { recommendation, rankedDebts };
}

/**
 * Get recommendation for a specific override debt
 * Returns the reason why this might not be the optimal choice
 */
export function getOverrideWarning(
  currentFocus: UserDebt,
  newFocus: UserDebt,
  recommendation: DebtRecommendation
): string | null {
  // If they're picking what we recommended, no warning
  if (newFocus.id === recommendation.focusDebtId) {
    return null;
  }

  // If switching from high APR to low APR
  if (
    currentFocus.interest_rate >= HIGH_APR_THRESHOLD &&
    newFocus.interest_rate < HIGH_APR_THRESHOLD
  ) {
    return `${currentFocus.name} has a higher interest rate (${currentFocus.interest_rate}% vs ${newFocus.interest_rate}%). You'll pay more in interest overall, but if this debt is more motivating to tackle, go for it!`;
  }

  return null;
}
