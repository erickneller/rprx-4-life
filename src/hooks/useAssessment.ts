import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateHorsemanScores, determinePrimaryHorseman } from '@/lib/scoringEngine';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { calculateInitialLeakEstimate } from '@/lib/moneyLeakEstimator';
import { startOnboarding } from '@/lib/onboardingEngine';
import { autoGenerateStrategy } from '@/lib/autoStrategyGenerator';
import { useProfile } from '@/hooks/useProfile';
import { useGamification } from '@/hooks/useGamification';
import { showAchievementToast, showPointsEarnedToast } from '@/components/gamification/AchievementToast';
import { toast } from '@/hooks/use-toast';
import type { AssessmentQuestion, AssessmentState } from '@/lib/assessmentTypes';
import type { HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';
import type { SavedPlan, CreatePlanInput } from '@/hooks/usePlans';

export type AssessmentPhase = 'core' | 'transition' | 'deep_dive';

export interface DeepDiveQuestionItem {
  id: string;
  horseman_type: string;
  question_text: string;
  question_type: string;
  options: { value: string; label: string; score: number }[];
  order_index: number;
}

export interface AssessmentExternalDeps {
  sendMessage: (params: { conversationId: string | null; userMessage: string }) => Promise<{ conversationId: string; assistantMessage: string } | null>;
  createPlan: (input: CreatePlanInput) => Promise<SavedPlan>;
}

export function useAssessment(questions: AssessmentQuestion[], editAssessmentId?: string, externalDeps?: AssessmentExternalDeps) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logActivity } = useGamification();
  
  const [state, setState] = useState<AssessmentState>({
    currentStep: 0,
    responses: {},
    isSubmitting: false,
    assessmentId: editAssessmentId || null,
  });

  const [phase, setPhase] = useState<AssessmentPhase>('core');
  const [deepDiveQuestions, setDeepDiveQuestions] = useState<DeepDiveQuestionItem[]>([]);
  const [deepDiveAnswers, setDeepDiveAnswers] = useState<Record<string, string | string[]>>({});
  const [deepDiveStep, setDeepDiveStep] = useState(0);
  const [calculatedHorseman, setCalculatedHorseman] = useState<HorsemanType | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editAssessmentId);

  // Pre-populate responses when editing an existing assessment
  useEffect(() => {
    if (!editAssessmentId || questions.length === 0) return;

    const fetchExistingResponses = async () => {
      try {
        // Fetch core responses
        const { data: responses, error: respError } = await supabase
          .from('assessment_responses')
          .select('question_id, response_value')
          .eq('assessment_id', editAssessmentId);

        if (!respError && responses) {
          const prefilled: Record<string, string> = {};
          responses.forEach((r) => {
            const val = (r.response_value as { value: string })?.value;
            if (val) prefilled[r.question_id] = val;
          });
          setState((prev) => ({ ...prev, responses: prefilled }));
        }

        // Fetch deep dive answers
        const { data: deepDive, error: ddError } = await supabase
          .from('user_deep_dives')
          .select('answers, horseman_type')
          .eq('assessment_id', editAssessmentId)
          .maybeSingle();

        if (!ddError && deepDive) {
          setDeepDiveAnswers((deepDive.answers as Record<string, string | string[]>) || {});
        }
      } catch (err) {
        console.error('Error loading existing assessment:', err);
      } finally {
        setIsLoadingEdit(false);
      }
    };

    fetchExistingResponses();
  }, [editAssessmentId, questions.length]);

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

    let hadNonCriticalFailure = false;

    try {
      // === WRITE 1: Create assessment record (CRITICAL — stop if fails) ===
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

      const cashFlowResult = profile
        ? calculateCashFlowFromNumbers(
            profile.monthly_income || 0,
            profile.monthly_debt_payments || 0,
            profile.monthly_housing || 0,
            profile.monthly_insurance || 0,
            profile.monthly_living_expenses || 0
          )
        : null;

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
      console.log('[Assessment] Write 1 success: assessment record created', assessment.id);

      // Save core responses
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

      // === WRITE 2: Money leak estimate → profiles (non-critical) ===
      try {
        const leakEstimate = calculateInitialLeakEstimate(profile?.monthly_income, primaryHorseman);
        const { error: leakError } = await supabase
          .from('profiles')
          .update({
            estimated_annual_leak_low: leakEstimate.low,
            estimated_annual_leak_high: leakEstimate.high,
          })
          .eq('id', user.id);
        if (leakError) throw leakError;
        console.log('[Assessment] Write 2 success: money leak estimate saved', leakEstimate);
      } catch (err) {
        console.error('[Assessment] Write 2 failed: money leak estimate', err);
        hadNonCriticalFailure = true;
      }

      // === WRITE 3: Onboarding progress row (non-critical) ===
      try {
        await startOnboarding(user.id);
        console.log('[Assessment] Write 3 success: onboarding progress row');
      } catch (err) {
        console.error('[Assessment] Write 3 failed: onboarding progress', err);
        hadNonCriticalFailure = true;
      }

      // === WRITE 4: Auto-generate plan + activate strategy (non-critical) ===
      if (externalDeps?.sendMessage && externalDeps?.createPlan) {
        try {
          // Check if focus plan already exists
          const { data: existingFocus } = await supabase
            .from('saved_plans')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_focus', true)
            .maybeSingle();

          if (!existingFocus) {
            // Build response details for prompt
            const responseDetails = questions
              .filter((q) => state.responses[q.id])
              .map((q) => ({
                question_text: q.question_text,
                category: q.category,
                selected_value: state.responses[q.id],
                horseman_type: Object.entries(q.horseman_weights as Record<string, number>)
                  .sort(([, a], [, b]) => b - a)[0]?.[0] || 'interest',
              }));

            const { data: existingPlans } = await supabase
              .from('saved_plans')
              .select('strategy_name')
              .eq('user_id', user.id);

            await autoGenerateStrategy({
              userId: user.id,
              profile: profile ?? null,
              assessment: {
                id: assessment.id,
                user_id: user.id,
                primary_horseman: primaryHorseman as HorsemanType,
                interest_score: scores.interest,
                taxes_score: scores.taxes,
                insurance_score: scores.insurance,
                education_score: scores.education,
                cash_flow_status: (cashFlowResult?.status ?? null) as CashFlowStatus,
                completed_at: assessment.completed_at,
                created_at: assessment.created_at,
                income_range: null,
                expense_range: null,
              },
              responses: responseDetails,
              existingPlanNames: (existingPlans || []).map((p) => p.strategy_name),
              sendMessage: externalDeps.sendMessage,
              createPlan: externalDeps.createPlan,
            });
            console.log('[Assessment] Write 4 success: auto-generated plan');
          } else {
            console.log('[Assessment] Write 4 skipped: focus plan already exists');
          }
        } catch (err) {
          console.error('[Assessment] Write 4 failed: auto-generate plan', err);
          hadNonCriticalFailure = true;
        }
      } else {
        console.log('[Assessment] Write 4 skipped: sendMessage/createPlan not provided');
      }

      // Log gamification activity (fire-and-forget)
      logActivity('assessment_complete', { assessment_id: assessment.id }).then(({ awarded, xpEarned }) => {
        if (xpEarned > 0) showPointsEarnedToast(xpEarned, 'Assessment completed!');
        awarded.forEach((badge) => showAchievementToast(badge));
      });
      logActivity('deep_dive_complete', { assessment_id: assessment.id, horseman_type: primaryHorseman }).then(({ awarded, xpEarned }) => {
        if (xpEarned > 0) showPointsEarnedToast(xpEarned, 'Deep Dive completed!');
        awarded.forEach((badge) => showAchievementToast(badge));
      });

      // === WRITE 5: Navigate to dashboard ===
      if (hadNonCriticalFailure) {
        toast({
          title: "We're still setting up your plan",
          description: "Check back in a moment — everything will be ready shortly.",
        });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('[Assessment] Critical write failed:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [user, questions, state.responses, deepDiveAnswers, calculatedHorseman, navigate, profile, logActivity, externalDeps]);

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
    isLoadingEdit,
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
