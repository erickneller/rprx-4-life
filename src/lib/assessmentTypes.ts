import type { HorsemanType } from './scoringEngine';
import type { CashFlowStatus } from './cashFlowCalculator';

export type QuestionType = 'slider' | 'single_choice' | 'yes_no' | 'range_select';

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
  midpoint?: number;
}

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  order_index: number;
  options: QuestionOption[];
  horseman_weights: Record<string, number>;
  category: string;
}

export interface UserAssessment {
  id: string;
  user_id: string;
  completed_at: string | null;
  interest_score: number;
  taxes_score: number;
  insurance_score: number;
  education_score: number;
  primary_horseman: HorsemanType | null;
  cash_flow_status: CashFlowStatus | null;
  income_range: string | null;
  expense_range: string | null;
  created_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  response_value: {
    value: string;
  };
  created_at: string;
}

export interface AssessmentState {
  currentStep: number;
  responses: Record<string, string>;
  isSubmitting: boolean;
  assessmentId: string | null;
}
