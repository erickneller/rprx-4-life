import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateHorsemanScores, determinePrimaryHorseman } from '@/lib/scoringEngine';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { useProfile } from '@/hooks/useProfile';
import { useGamification } from '@/hooks/useGamification';
import { showAchievementToast, showPointsEarnedToast } from '@/components/gamification/AchievementToast';
import type { AssessmentQuestion, AssessmentState } from '@/lib/assessmentTypes';
import type { HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

export type AssessmentPhase = 'core' | 'transition' | 'deep_dive';

export interface DeepDiveQuestionItem {
  id: string;
  horseman_type: string;
  question_text: string;
  question_type: string;
  options: { value: string; label: string; score: number }[];
  order_index: number;
}

export function useAssessment(questions: AssessmentQuestion[]) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logActivity } = useGamification();
  
  const [state, setState] = useState<AssessmentState>({
    currentStep: 0,
    responses: {},
    isSubmitting: false,
    assessmentId: null,
  });

  const [phase, setPhase] = useState<AssessmentPhase>('core');
  const [deepDiveQuestions, setDeepDiveQuestions] = useState<DeepDiveQuestionItem[]>([]);
  const [deepDiveAnswers, setDeepDiveAnswers] = useState<Record<string, string | string[]>>({});
  const [deepDiveStep, setDeepDiveStep] = useState(0);
  const [calculatedHorseman, setCalculatedHorseman] = useState<HorsemanType | null>(null);

  // Core question navigation
  const currentQuestion = phase === 'core' ? questions[state.currentStep] : null;
  const currentDeepDiveQuestion = phase === 'deep_dive' ? deepDiveQuestions[deepDiveStep] : null;

  const totalCoreSteps = questions.length;
  const totalDeepDiveSteps = deepDiveQuestions.length;
  const totalSteps = totalCoreSteps + totalDeepDiveSteps;

  const currentOverallStep = phase === 'core'
    ? state.currentStep
    : phase === 'transition'
      ? totalCoreSteps
      : totalCoreSteps + deepDiveStep;

  const progress = totalSteps > 0 ? ((currentOverallStep + 1) / totalSteps) * 100 : 0;

  const setResponse = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      responses: { ...prev.responses, [questionId]: value },
    }));
  }, []);

  const setDeepDiveAnswer = useCallback((questionId: string, value: string | string[]) => {
    setDeepDiveAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // Calculate horseman and fetch deep dive questions when transitioning
  const transitionToDeepDive = useCallback(async () => {
    // Calculate scores from core responses
    const responseObjects = questions
      .filter((q) => state.responses[q.id])
      .map((q) => ({
        questionId: q.id,
        value: state.responses[q.id],
        horsemanWeights: q.horseman_weights,
        options: q.options,
        category: q.category,
      }));

    const scores = calculateHorsemanScores(responseObjects);
    const primaryHorseman = determinePrimaryHorseman(scores);
    setCalculatedHorseman(primaryHorseman);

    // Show transition screen
    setPhase('transition');

    // Fetch deep dive questions
    const { data, error } = await supabase
      .from('deep_dive_questions')
      .select('*')
      .eq('horseman_type', primaryHorseman)
      .order('order_index');

    if (!error && data && data.length > 0) {
      setDeepDiveQuestions(data as unknown as DeepDiveQuestionItem[]);
    }
  }, [questions, state.responses]);

  const startDeepDive = useCallback(() => {
    setPhase('deep_dive');
  }, []);

  const goToNext = useCallback(() => {
    if (phase === 'core') {
      if (state.currentStep < totalCoreSteps - 1) {
        setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
      }
    } else if (phase === 'deep_dive') {
      if (deepDiveStep < totalDeepDiveSteps - 1) {
        setDeepDiveStep((i) => i + 1);
      }
    }
  }, [phase, state.currentStep, totalCoreSteps, deepDiveStep, totalDeepDiveSteps]);

  const goToPrevious = useCallback(() => {
    if (phase === 'core') {
      if (state.currentStep > 0) {
        setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
      }
    } else if (phase === 'deep_dive') {
      if (deepDiveStep > 0) {
        setDeepDiveStep((i) => i - 1);
      }
    }
  }, [phase, state.currentStep, deepDiveStep]);

  const canGoNext = useCallback(() => {
    if (phase === 'core') {
      if (!currentQuestion) return false;
      return !!state.responses[currentQuestion.id];
    }
    if (phase === 'deep_dive') {
      if (!currentDeepDiveQuestion) return false;
      const answer = deepDiveAnswers[currentDeepDiveQuestion.id];
      if (!answer) return false;
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== '';
    }
    return false;
  }, [phase, currentQuestion, state.responses, currentDeepDiveQuestion, deepDiveAnswers]);

  const isLastCoreStep = state.currentStep === totalCoreSteps - 1;
  const isLastDeepDiveStep = deepDiveStep === totalDeepDiveSteps - 1;
  const isLastStep = phase === 'deep_dive' && isLastDeepDiveStep;

  const submitAssessment = useCallback(async () => {
    if (!user || !calculatedHorseman) return;

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

      const scores = calculateHorsemanScores(responseObjects);
      const primaryHorseman = determinePrimaryHorseman(scores);

      // Get cash flow data from profile
      const cashFlowResult = profile
        ? calculateCashFlowFromNumbers(
            profile.monthly_income || 0,
            profile.monthly_debt_payments || 0,
            profile.monthly_housing || 0,
            profile.monthly_insurance || 0,
            profile.monthly_living_expenses || 0
          )
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
          cash_flow_status: (cashFlowResult?.status ?? null) as CashFlowStatus,
          income_range: null,
          expense_range: null,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create core response records
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

      // Save deep dive answers
      if (Object.keys(deepDiveAnswers).length > 0) {
        const { error: deepDiveError } = await supabase
          .from('user_deep_dives')
          .insert({
            user_id: user.id,
            assessment_id: assessment.id,
            horseman_type: primaryHorseman,
            answers: deepDiveAnswers,
          });

        if (deepDiveError) throw deepDiveError;
      }

      // Log gamification activity
      logActivity('assessment_complete', { assessment_id: assessment.id }).then((awarded) => {
        showPointsEarnedToast(100, 'Assessment completed!');
        awarded.forEach((badge) => showAchievementToast(badge));
      });

      // Also log deep dive completion
      logActivity('deep_dive_complete', { assessment_id: assessment.id, horseman_type: primaryHorseman }).then((awarded) => {
        showPointsEarnedToast(75, 'Deep Dive completed!');
        awarded.forEach((badge) => showAchievementToast(badge));
      });

      // Navigate to results
      navigate(`/results/${assessment.id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [user, questions, state.responses, deepDiveAnswers, calculatedHorseman, navigate, profile, logActivity]);

  return {
    // Phase
    phase,
    calculatedHorseman,
    // Core
    currentStep: state.currentStep,
    currentQuestion,
    totalSteps,
    progress,
    responses: state.responses,
    isSubmitting: state.isSubmitting,
    isLastCoreStep,
    setResponse,
    // Deep dive
    deepDiveQuestions,
    currentDeepDiveQuestion,
    deepDiveStep,
    totalDeepDiveSteps,
    deepDiveAnswers,
    isLastDeepDiveStep,
    setDeepDiveAnswer,
    // Navigation
    goToNext,
    goToPrevious,
    canGoNext,
    isLastStep,
    // Transitions
    transitionToDeepDive,
    startDeepDive,
    // Submit
    submitAssessment,
  };
}
