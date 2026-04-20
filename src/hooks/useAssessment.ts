import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateHorsemanScores, determinePrimaryHorseman } from '@/lib/scoringEngine';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { calculateInitialLeakEstimate } from '@/lib/moneyLeakEstimator';
import { startOnboarding } from '@/lib/onboardingEngine';
import { autoGenerateStrategy, generateFallbackPlan } from '@/lib/autoStrategyGenerator';
import { calculateRPRxScore, type StrategyData } from '@/lib/rprxScoreEngine';
import { useProfile, type Profile } from '@/hooks/useProfile';
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
  const queryClient = useQueryClient();
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
      // === STEP 0: Fetch fresh profile from DB (bypass React Query cache) ===
      const { data: freshProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      const freshProfile = (freshProfileData ?? profile ?? null) as Profile | null;

      // === STEP 1: Calculate horseman scores ===
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

      const cashFlowResult = freshProfile
        ? calculateCashFlowFromNumbers(
            freshProfile.monthly_income || 0,
            freshProfile.monthly_debt_payments || 0,
            freshProfile.monthly_housing || 0,
            freshProfile.monthly_insurance || 0,
            freshProfile.monthly_living_expenses || 0
          )
        : null;

      // === WRITE 1: Create assessment record (CRITICAL — stop if fails) ===
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

      // === WRITE 2: RPRx score + 5 pillars + money leak → profiles ===
      try {
        // Build strategy data (minimal at assessment time — no strategies completed yet)
        const deepDiveCompleted = Object.keys(deepDiveAnswers).length > 0;
        const strategyData: StrategyData = {
          activatedCount: 0,
          completedCount: 0,
          completedByHorseman: { interest: 0, taxes: 0, insurance: 0, education: 0 },
          deepDiveCompleted,
          taxDeepDiveAnswers: primaryHorseman === 'taxes' ? deepDiveAnswers : null,
        };

        // Calculate RPRx score from fresh profile data
        let scoreResult = { total: 0, river: 0, lake: 0, rainbow: 0, tax: 0, stress: 0, grade: 'at_risk', gradeLabel: 'At Risk', gradeIcon: '🔴', insights: [] as string[] };
        if (freshProfile) {
          scoreResult = calculateRPRxScore(freshProfile, strategyData);
        }

        // Calculate money leak from fresh profile income
        const leakEstimate = calculateInitialLeakEstimate(freshProfile?.monthly_income, primaryHorseman);

        // Single profile update: RPRx score + pillars + grade + money leak
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            rprx_score: scoreResult.total,
            rprx_score_river: scoreResult.river,
            rprx_score_lake: scoreResult.lake,
            rprx_score_rainbow: scoreResult.rainbow,
            rprx_score_tax: scoreResult.tax,
            rprx_score_stress: scoreResult.stress,
            rprx_score_total: scoreResult.total,
            rprx_grade: scoreResult.grade,
            current_tier: scoreResult.grade,
            estimated_annual_leak_low: leakEstimate.low,
            estimated_annual_leak_high: leakEstimate.high,
          })
          .eq('id', user.id);
        if (profileError) throw profileError;
        console.log('[Assessment] Write 2 success: RPRx score + money leak saved', { score: scoreResult.total, grade: scoreResult.grade, leak: leakEstimate });
      } catch (err) {
        console.error('[Assessment] Write 2 failed: RPRx score + money leak', err);
        hadNonCriticalFailure = true;
      }

      // === WRITE 3: Onboarding progress row ===
      try {
        await startOnboarding(user.id);
        console.log('[Assessment] Write 3 success: onboarding progress row');
      } catch (err) {
        console.error('[Assessment] Write 3 failed: onboarding progress', err);
        hadNonCriticalFailure = true;
      }

      // === WRITE 4: Auto-generate plan + activate strategy ===
      try {
        // Check if focus plan already exists
        const { data: existingFocus } = await supabase
          .from('saved_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_focus', true)
          .maybeSingle();

        if (!existingFocus) {
          let planGenerated = false;

          // Try AI-powered plan generation first
          if (externalDeps?.sendMessage && externalDeps?.createPlan) {
            try {
              const responseDetails = questions
                .filter((q) => state.responses[q.id])
                .map((q) => ({
                  question_text: q.question_text,
                  category: q.category,
                  value: state.responses[q.id],
                }));

              const { data: existingPlans } = await supabase
                .from('saved_plans')
                .select('strategy_name')
                .eq('user_id', user.id);

              await autoGenerateStrategy({
                userId: user.id,
                profile: freshProfile ?? null,
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
              planGenerated = true;
              console.log('[Assessment] Write 4 success: AI-generated plan');
            } catch (aiErr) {
              console.warn('[Assessment] AI plan generation failed, falling back to strategy definitions:', aiErr);
            }
          }

          // Fallback: generate plan from strategy_definitions if AI failed or deps unavailable
          if (!planGenerated) {
            try {
              await generateFallbackPlan({
                userId: user.id,
                primaryHorseman,
                createPlan: externalDeps?.createPlan,
              });
              console.log('[Assessment] Write 4 success: fallback plan generated from strategy definitions');
            } catch (fallbackErr) {
              console.error('[Assessment] Write 4 failed: fallback plan generation', fallbackErr);
              hadNonCriticalFailure = true;
            }
          }
        } else {
          console.log('[Assessment] Write 4 skipped: focus plan already exists');
        }
      } catch (err) {
        console.error('[Assessment] Write 4 failed: plan generation', err);
        hadNonCriticalFailure = true;
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

      // Invalidate caches so route guards see the new assessment + fresh profile
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assessmentHistory', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['assessment', assessment.id] }),
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] }),
      ]);

      // Navigate to results
      if (hadNonCriticalFailure) {
        toast({
          title: "We're still setting up your plan",
          description: "Check back in a moment — everything will be ready shortly.",
        });
      }
      console.log(`[Assessment] Navigating to /results/${assessment.id}`);
      navigate(`/results/${assessment.id}`);
    } catch (error) {
      console.error('[Assessment] Critical write failed:', error);
      toast({
        title: "We couldn't save your assessment",
        description: "Please try again. Your answers are still here.",
        variant: 'destructive',
      });
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
