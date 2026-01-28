import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateHorsemanScores, determinePrimaryHorseman } from '@/lib/scoringEngine';
import { calculateCashFlowStatus } from '@/lib/cashFlowCalculator';
import type { AssessmentQuestion, AssessmentState } from '@/lib/assessmentTypes';
import type { HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

export function useAssessment(questions: AssessmentQuestion[]) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [state, setState] = useState<AssessmentState>({
    currentStep: 0,
    responses: {},
    isSubmitting: false,
    assessmentId: null,
  });

  const currentQuestion = questions[state.currentStep];
  const totalSteps = questions.length;
  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  const setResponse = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: value,
      },
    }));
  }, []);

  const goToNext = useCallback(() => {
    if (state.currentStep < totalSteps - 1) {
      setState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  }, [state.currentStep, totalSteps]);

  const goToPrevious = useCallback(() => {
    if (state.currentStep > 0) {
      setState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [state.currentStep]);

  const canGoNext = useCallback(() => {
    if (!currentQuestion) return false;
    return !!state.responses[currentQuestion.id];
  }, [currentQuestion, state.responses]);

  const isLastStep = state.currentStep === totalSteps - 1;

  const submitAssessment = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Build response objects for scoring
      const responseObjects = questions
        .filter((q) => state.responses[q.id])
        .map((q) => ({
          questionId: q.id,
          value: state.responses[q.id],
          horsemanWeights: q.horseman_weights,
          options: q.options,
          category: q.category,
        }));

      // Calculate scores
      const scores = calculateHorsemanScores(responseObjects);
      const primaryHorseman = determinePrimaryHorseman(scores);

      // Get cash flow data
      const incomeQuestion = questions.find((q) => q.order_index === 16);
      const expenseQuestion = questions.find((q) => q.order_index === 17);
      const incomeRange = incomeQuestion ? state.responses[incomeQuestion.id] : null;
      const expenseRange = expenseQuestion ? state.responses[expenseQuestion.id] : null;

      const cashFlowStatus =
        incomeRange && expenseRange
          ? calculateCashFlowStatus(incomeRange, expenseRange)
          : null;

      // Create assessment record
      const { data: assessment, error: assessmentError } = await supabase
        .from('user_assessments')
        .insert({
          user_id: user.id,
          completed_at: new Date().toISOString(),
          interest_score: scores.interest,
          taxes_score: scores.taxes,
          insurance_score: scores.insurance,
          education_score: scores.education,
          primary_horseman: primaryHorseman as HorsemanType,
          cash_flow_status: cashFlowStatus as CashFlowStatus,
          income_range: incomeRange,
          expense_range: expenseRange,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create response records
      const responseRecords = Object.entries(state.responses).map(
        ([questionId, value]) => ({
          assessment_id: assessment.id,
          question_id: questionId,
          response_value: { value },
        })
      );

      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responseRecords);

      if (responsesError) throw responsesError;

      // Navigate to results
      navigate(`/results/${assessment.id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [user, questions, state.responses, navigate]);

  return {
    currentStep: state.currentStep,
    currentQuestion,
    totalSteps,
    progress,
    responses: state.responses,
    isSubmitting: state.isSubmitting,
    isLastStep,
    setResponse,
    goToNext,
    goToPrevious,
    canGoNext,
    submitAssessment,
  };
}
