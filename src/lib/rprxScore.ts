import type { Profile } from '@/hooks/useProfile';

const PROFILE_FIELDS: (keyof Profile)[] = [
  'full_name',
  'phone',
  'monthly_income',
  'monthly_debt_payments',
  'monthly_housing',
  'monthly_insurance',
  'monthly_living_expenses',
  'profile_type',
  'financial_goals',
  'filing_status',
];

export function calculateRPRxScore(profile: Profile | null | undefined, hasDeepDive?: boolean): number {
  // Base: 100 points for assessment completion (always true on results page)
  let score = 100;

  if (!profile) return score;

  // Profile completeness bonus: up to 50 points (10 fields × 5 pts each)
  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    if (value != null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      score += 5;
    }
  }

  // Deep Dive bonus: +75 points
  if (hasDeepDive) {
    score += 75;
  }

  return score;
}

export interface RPRxTier {
  emoji: string;
  label: string;
}

export function getRPRxTier(score: number): RPRxTier {
  if (score >= 800) return { emoji: '💎', label: 'Thriving' };
  if (score >= 600) return { emoji: '🟢', label: 'Recovering' };
  if (score >= 400) return { emoji: '🟡', label: 'Paying' };
  if (score >= 200) return { emoji: '🟠', label: 'Reducing' };
  return { emoji: '🔴', label: 'Awakening' };
}
