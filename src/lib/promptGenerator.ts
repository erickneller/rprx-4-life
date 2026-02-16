import type { HorsemanType } from './scoringEngine';
import type { CashFlowStatus } from './cashFlowCalculator';
import type { Profile } from '@/hooks/useProfile';
import type { UserAssessment } from './assessmentTypes';
import { getProfileTypeLabel, getFinancialGoalLabels } from './profileTypes';

const HORSEMAN_PHRASES: Record<HorsemanType, string> = {
  interest: 'debt and interest costs',
  taxes: 'tax efficiency',
  insurance: 'insurance and risk protection',
  education: 'education funding',
};

const CASH_FLOW_PHRASES: Record<CashFlowStatus, string> = {
  surplus: 'I have a healthy cash flow surplus.',
  tight: 'My income and expenses are closely balanced.',
  deficit: "I'm currently spending more than I earn.",
};

export function generateStrategyPrompt(
  primaryHorseman: HorsemanType,
  cashFlowStatus: CashFlowStatus | null
): string {
  const horsemanPhrase = HORSEMAN_PHRASES[primaryHorseman];
  const cashFlowPhrase = cashFlowStatus ? ` ${CASH_FLOW_PHRASES[cashFlowStatus]}` : '';

  return `My biggest financial pressure is ${horsemanPhrase}.${cashFlowPhrase} What are some strategies to address this?`;
}

export interface AssessmentResponseDetail {
  question_text: string;
  category: string;
  value: string;
}

export function generateAutoStrategyPrompt(
  profile: Profile | null,
  assessment: UserAssessment,
  responses: AssessmentResponseDetail[],
  completedStrategies: string[] = []
): string {
  const lines: string[] = [];

  lines.push('I need the single best financial strategy for my situation right now — the one that is easiest to implement and will produce the fastest results.');
  lines.push('');

  // Profile summary
  lines.push('## My Profile');
  if (profile) {
    const profileType = getProfileTypeLabel(profile.profile_type);
    if (profileType) lines.push(`- Profile type: ${profileType}`);
    if (profile.monthly_income) lines.push(`- Monthly income: $${profile.monthly_income.toLocaleString()}`);
    const totalExpenses = [
      profile.monthly_debt_payments,
      profile.monthly_housing,
      profile.monthly_insurance,
      profile.monthly_living_expenses,
    ].reduce((sum, v) => sum + (v || 0), 0);
    if (totalExpenses > 0) lines.push(`- Monthly expenses: ~$${totalExpenses.toLocaleString()}`);
    if (profile.num_children != null && profile.num_children > 0) {
      const agesStr = profile.children_ages?.length ? ` (ages: ${profile.children_ages.join(', ')})` : '';
      lines.push(`- Children: ${profile.num_children}${agesStr}`);
    }
    const goalLabels = getFinancialGoalLabels(profile.financial_goals);
    if (goalLabels.length > 0) lines.push(`- Financial goals: ${goalLabels.join(', ')}`);
  } else {
    lines.push('- Profile data not available');
  }
  lines.push('');

  // Assessment summary
  lines.push('## My Assessment Results');
  lines.push(`- Primary financial pressure: ${HORSEMAN_PHRASES[assessment.primary_horseman as HorsemanType] || assessment.primary_horseman}`);
  lines.push(`- Interest score: ${assessment.interest_score}/100`);
  lines.push(`- Taxes score: ${assessment.taxes_score}/100`);
  lines.push(`- Insurance score: ${assessment.insurance_score}/100`);
  lines.push(`- Education score: ${assessment.education_score}/100`);
  if (assessment.cash_flow_status) {
    lines.push(`- Cash flow: ${CASH_FLOW_PHRASES[assessment.cash_flow_status as CashFlowStatus]}`);
  }
  lines.push('');

  // Assessment answers by category
  if (responses.length > 0) {
    lines.push('## My Assessment Answers');
    const byCategory: Record<string, string[]> = {};
    for (const r of responses) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(`${r.question_text}: ${r.value}`);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`### ${cat}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
    }
    lines.push('');
  }

  // Previously completed strategies
  if (completedStrategies.length > 0) {
    lines.push('## Strategies I\'ve Already Completed');
    for (const name of completedStrategies) {
      lines.push(`- ${name}`);
    }
    lines.push('');
    lines.push('Do NOT recommend any strategy I have already completed.');
    lines.push('');
  }

  lines.push('## Instructions');
  lines.push('Based on all of the above, recommend exactly 1 strategy that is the easiest to implement and will produce the fastest results for my situation.');
  lines.push('For the strategy, use the standard strategy output format with name, summary, estimated savings, implementation steps, and any disclaimers.');
  lines.push('Include detailed numbered implementation steps that I can check off as I complete them.');

  return lines.join('\n');
}
