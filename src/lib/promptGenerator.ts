import type { HorsemanType } from './scoringEngine';
import type { CashFlowStatus } from './cashFlowCalculator';

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
