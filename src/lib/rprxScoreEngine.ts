import type { Profile } from '@/hooks/useProfile';

// ── Types ──────────────────────────────────────────────────────────

export interface StrategyData {
  activatedCount: number;
  completedCount: number;
  completedByHorseman: { interest: number; taxes: number; insurance: number; education: number };
  deepDiveCompleted: boolean;
  taxDeepDiveAnswers: any | null;
}

export interface RPRxScoreResult {
  total: number;
  river: number;
  lake: number;
  rainbow: number;
  tax: number;
  stress: number;
  grade: string;
  gradeLabel: string;
  gradeIcon: string;
  insights: string[];
}

// ── Helpers ────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── River Score (max 25) ──────────────────────────────────────────

function calcRiver(profile: Profile, strategyData: StrategyData): number {
  const income = profile.monthly_income ?? 0;
  const housing = profile.monthly_housing ?? 0;
  const living = profile.monthly_living_expenses ?? 0;
  const ins = profile.monthly_insurance ?? 0;
  const debt = profile.monthly_debt_payments ?? 0;
  const emergency = profile.emergency_fund_balance ?? 0;

  const expenses = housing + living + ins;
  const surplus = income - expenses - debt;
  const surplusRatio = income > 0 ? surplus / income : 0;
  const dtiRatio = income > 0 ? debt / income : 1;
  const monthsEmergency = expenses > 0 ? emergency / expenses : 0;

  // Surplus score (max 8)
  let surplusScore = 0;
  if (surplusRatio > 0.20) surplusScore = 8;
  else if (surplusRatio > 0.10) surplusScore = 6;
  else if (surplusRatio > 0.05) surplusScore = 4;
  else if (surplusRatio > 0) surplusScore = 2;

  // DTI score (max 7)
  let dtiScore = 0;
  if (dtiRatio <= 0.20) dtiScore = 7;
  else if (dtiRatio <= 0.36) dtiScore = 5;
  else if (dtiRatio <= 0.43) dtiScore = 3;
  else if (dtiRatio <= 0.50) dtiScore = 2;

  // Emergency fund score (max 5)
  let emergencyScore = 0;
  if (monthsEmergency >= 6) emergencyScore = 5;
  else if (monthsEmergency >= 3) emergencyScore = 4;
  else if (monthsEmergency >= 1) emergencyScore = 2;
  else if (monthsEmergency >= 0.5) emergencyScore = 1;

  // Strategy bonus (max 5)
  const strategyBonus = clamp(strategyData.completedByHorseman.interest, 0, 5);

  return clamp(surplusScore + dtiScore + emergencyScore + strategyBonus, 0, 25);
}

// ── Lake Score (max 25) ──────────────────────────────────────────

function calcLake(profile: Profile): number {
  const years = profile.years_until_retirement ?? 0;
  const desired = profile.desired_retirement_income ?? 0;
  const balance = profile.retirement_balance_total ?? 0;
  const monthly = profile.retirement_contribution_monthly ?? 0;
  const matchCaptured = profile.employer_match_captured;
  const income = profile.monthly_income ?? 0;

  const monthsRemaining = years * 12;
  const monthlyRate = 0.055 / 12;

  let futureValue = balance;
  if (monthsRemaining > 0 && monthlyRate > 0) {
    futureValue = balance * Math.pow(1 + monthlyRate, monthsRemaining) +
      monthly * ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate);
  }

  const neededNestEgg = desired * 25;
  const readinessRatio = neededNestEgg > 0 ? futureValue / neededNestEgg : 0;

  // Readiness score (max 15)
  let readinessScore = 0;
  if (readinessRatio >= 1.0) readinessScore = 15;
  else if (readinessRatio > 0.75) readinessScore = 13;
  else if (readinessRatio > 0.50) readinessScore = 11;
  else if (readinessRatio > 0.25) readinessScore = 7;
  else if (readinessRatio > 0) readinessScore = 3;

  // Employer match score (max 5)
  let matchScore = 0;
  if (matchCaptured === 'yes') matchScore = 5;
  else if (matchCaptured === 'na') matchScore = 3;
  else if (matchCaptured === 'not_sure') matchScore = 2;
  // 'no' or null = 0

  // Contributing score (max 5)
  let contributingScore = 0;
  if (monthly > 0) {
    const threshold5 = income * 0.05;
    const threshold10 = income * 0.10;
    if (monthly >= threshold10) contributingScore = 5;
    else if (monthly >= threshold5) contributingScore = 3;
    else contributingScore = 2;
  }

  return clamp(readinessScore + matchScore + contributingScore, 0, 25);
}

// ── Rainbow Score (max 20) ───────────────────────────────────────

function calcRainbow(profile: Profile): number {
  const hasHealth = profile.health_insurance ?? false;
  const hasLife = profile.life_insurance ?? false;
  const hasDisability = profile.disability_insurance ?? false;
  const hasLTC = profile.long_term_care_insurance ?? false;
  const dependents = profile.num_children ?? 0;

  // Assume age 40 since we don't have date_of_birth
  const age = 40;

  // Base scores
  let healthScore = hasHealth ? 6 : 0;
  let lifeScore = hasLife ? 6 : 0;
  let disabilityScore = hasDisability ? 4 : 0;
  let ltcScore = hasLTC ? 4 : 0;

  // Max adjustments based on age and dependents
  if (dependents === 0) {
    lifeScore = Math.min(lifeScore, 3);
    disabilityScore = Math.min(disabilityScore, 5);
  }
  if (age < 40) {
    ltcScore = Math.min(ltcScore, 2);
    disabilityScore = Math.min(disabilityScore, 6);
  }
  if (age > 55) {
    ltcScore = Math.min(ltcScore, 6);
    healthScore = Math.min(healthScore, 4);
  }

  return clamp(healthScore + lifeScore + disabilityScore + ltcScore, 0, 20);
}

// ── Tax Score (max 15) ──────────────────────────────────────────

function calcTax(profile: Profile, strategyData: StrategyData): number {
  const filingStatus = profile.filing_status;
  const taxAccounts = (profile.tax_advantaged_accounts as string[]) ?? [];

  // Filing status score (max 3)
  let filingScore = 0;
  if (filingStatus) filingScore = 2;
  if (strategyData.deepDiveCompleted) filingScore = 3;

  // Tax-advantaged accounts score (max 5)
  let accountsScore = 0;
  if (taxAccounts.length >= 3) accountsScore = 5;
  else if (taxAccounts.length === 2) accountsScore = 3;
  else if (taxAccounts.length === 1) accountsScore = 2;

  // W-4 optimization score (max 4)
  let w4Score = 2; // neutral default
  if (strategyData.taxDeepDiveAnswers) {
    const answers = strategyData.taxDeepDiveAnswers as Record<string, string>;
    // Look for the refund/owed question answer
    const q1Answer = Object.values(answers)[0];
    if (q1Answer) {
      const w4Map: Record<string, number> = {
        'broke_even': 4,
        'owed_under_1k': 3,
        'refund_500_2k': 3,
        'owed_1k_plus': 1,
        'refund_2k_5k': 1,
        'refund_over_5k': 0,
      };
      w4Score = w4Map[q1Answer] ?? 2;
    }
  }

  // Tax strategy bonus (max 3)
  const strategyBonus = clamp(strategyData.completedByHorseman.taxes, 0, 3);

  return clamp(filingScore + accountsScore + w4Score + strategyBonus, 0, 15);
}

// ── Stress Score (max 15) ────────────────────────────────────────

function calcStress(profile: Profile): number {
  const worryMap: Record<string, number> = { 'never': 5, 'rarely': 4, 'sometimes': 3, 'often': 1, 'constantly': 0 };
  const confidenceMap: Record<string, number> = { 'very_confident': 5, 'somewhat': 3, 'not_confident': 1, 'couldnt': 0 };
  const controlMap: Record<string, number> = { 'fully': 5, 'mostly': 4, 'somewhat': 2, 'not_at_all': 0 };

  const worry = profile.stress_money_worry ? (worryMap[profile.stress_money_worry] ?? 2) : 2;
  const confidence = profile.stress_emergency_confidence ? (confidenceMap[profile.stress_emergency_confidence] ?? 2) : 2;
  const control = profile.stress_control_feeling ? (controlMap[profile.stress_control_feeling] ?? 2) : 2;

  return clamp(worry + confidence + control, 0, 15);
}

// ── Grade ────────────────────────────────────────────────────────

interface GradeInfo {
  grade: string;
  gradeLabel: string;
  gradeIcon: string;
}

function getGrade(total: number): GradeInfo {
  if (total >= 85) return { grade: 'thriving', gradeLabel: 'Thriving', gradeIcon: '💎' };
  if (total >= 70) return { grade: 'recovering', gradeLabel: 'Recovering', gradeIcon: '🟢' };
  if (total >= 55) return { grade: 'progressing', gradeLabel: 'Progressing', gradeIcon: '🟡' };
  if (total >= 40) return { grade: 'awakening', gradeLabel: 'Awakening', gradeIcon: '🟠' };
  return { grade: 'at_risk', gradeLabel: 'At Risk', gradeIcon: '🔴' };
}

// ── Insights ─────────────────────────────────────────────────────

function generateInsights(river: number, lake: number, rainbow: number, tax: number, stress: number): string[] {
  const insights: string[] = [];

  // Positive insights first
  if (river / 25 >= 0.8) insights.push('Your cash flow is strong — that\'s a solid foundation to build on.');
  if (lake / 25 >= 0.8) insights.push('Your retirement planning is strong — that\'s a solid foundation to build on.');
  if (rainbow / 20 >= 0.8) insights.push('Your insurance coverage is strong — that\'s a solid foundation to build on.');
  if (tax / 15 >= 0.8) insights.push('Your tax efficiency is strong — that\'s a solid foundation to build on.');
  if (stress / 15 >= 0.8) insights.push('Your financial confidence is strong — that\'s a solid foundation to build on.');

  // Improvement insights
  if (river < 12) insights.push('Your cash flow has room to grow — reducing debt or building an emergency fund would make the biggest impact.');
  if (lake < 12) insights.push('Your retirement trajectory needs attention — even small increases in contributions can make a big difference over time.');
  if (rainbow < 10) insights.push('You have gaps in your insurance coverage — protecting what you\'ve built is essential.');
  if (tax < 7) insights.push('There may be tax savings you\'re not capturing — tax-advantaged accounts and withholding optimization could help.');
  if (stress < 7) insights.push('Financial stress is weighing on you — completing your next RPRx strategy can help build confidence and control.');

  // Ensure at least one positive if none exist
  if (insights.length === 0 || insights.every(i => !i.includes('strong'))) {
    const best = Math.max(river / 25, lake / 25, rainbow / 20, tax / 15, stress / 15);
    if (best === river / 25) insights.unshift('Your cash flow management shows promise — keep building on it.');
    else if (best === lake / 25) insights.unshift('Your retirement planning shows promise — keep building on it.');
    else if (best === rainbow / 20) insights.unshift('Your insurance coverage shows promise — keep building on it.');
    else if (best === tax / 15) insights.unshift('Your tax planning shows promise — keep building on it.');
    else insights.unshift('Your financial confidence shows promise — keep building on it.');
  }

  // Return 2-3 insights
  return insights.slice(0, 3);
}

// ── Main Function ────────────────────────────────────────────────

export function calculateRPRxScore(profile: Profile, strategyData: StrategyData): RPRxScoreResult {
  const river = calcRiver(profile, strategyData);
  const lake = calcLake(profile);
  const rainbow = calcRainbow(profile);
  const tax = calcTax(profile, strategyData);
  const stress = calcStress(profile);

  const total = clamp(river + lake + rainbow + tax + stress, 0, 100);
  const gradeInfo = getGrade(total);
  const insights = generateInsights(river, lake, rainbow, tax, stress);

  return {
    total,
    river,
    lake,
    rainbow,
    tax,
    stress,
    ...gradeInfo,
    insights,
  };
}
