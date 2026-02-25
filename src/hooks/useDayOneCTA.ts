import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { usePlans, useCreatePlan } from './usePlans';
import { useAssessmentHistory } from './useAssessmentHistory';
import { useSendMessage } from './useSendMessage';
import { autoGenerateStrategy } from '@/lib/autoStrategyGenerator';
import { toast } from './use-toast';
import type { AssessmentResponseDetail } from '@/lib/promptGenerator';
import { useQuery } from '@tanstack/react-query';

function useActiveStrategiesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activeStrategiesCount', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('user_active_strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

function useLatestAssessmentResponses(assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentResponses', assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<AssessmentResponseDetail[]> => {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('response_value, question_id')
        .eq('assessment_id', assessmentId!);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const questionIds = data.map((r) => r.question_id);
      const { data: questions, error: qErr } = await supabase
        .from('assessment_questions')
        .select('id, question_text, category')
        .in('id', questionIds);
      if (qErr) throw qErr;

      const qMap = new Map(questions?.map((q) => [q.id, q]) || []);
      return data.map((r) => {
        const q = qMap.get(r.question_id);
        const val = (r.response_value as { value?: string })?.value ?? JSON.stringify(r.response_value);
        return {
          question_text: q?.question_text ?? 'Unknown question',
          category: q?.category ?? 'General',
          value: val,
        };
      });
    },
  });
}

export type DayOneCTAState = 'build' | 'activate' | 'view_leak' | 'see_results';

export function useDayOneCTA() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { data: plans = [] } = usePlans();
  const { data: assessments = [] } = useAssessmentHistory();
  const { data: activeCount = 0 } = useActiveStrategiesCount();
  const { sendMessage } = useSendMessage();
  const createPlanMutation = useCreatePlan();
  const [isGenerating, setIsGenerating] = useState(false);

  const latestAssessment = assessments[0] ?? null;
  const { data: responses = [] } = useLatestAssessmentResponses(latestAssessment?.id);

  const state: DayOneCTAState = useMemo(() => {
    if (plans.length === 0) return 'build';
    if (activeCount === 0) return 'activate';
    if ((profile?.estimated_annual_leak_low ?? 0) > 0) return 'view_leak';
    return 'see_results';
  }, [plans.length, activeCount, profile?.estimated_annual_leak_low]);

  const buttonText = useMemo(() => {
    switch (state) {
      case 'build': return 'Build My Recovery Plan';
      case 'activate': return 'Activate My First Strategy';
      case 'view_leak': return 'View My Money Leak';
      case 'see_results': return 'See My Results';
    }
  }, [state]);

  const action = useCallback(async () => {
    switch (state) {
      case 'build': {
        if (!latestAssessment) {
          navigate('/assessment');
          return;
        }
        // Free tier guard
        if (plans.length >= 1) {
          toast({
            title: 'Plan limit reached',
            description: 'Free accounts are limited to 1 plan. Complete or delete your current plan first.',
            variant: 'destructive',
          });
          return;
        }
        setIsGenerating(true);
        try {
          await autoGenerateStrategy({
            profile: profile ?? null,
            assessment: latestAssessment,
            responses,
            existingPlanNames: plans.map((p) => p.strategy_name),
            sendMessage,
            createPlan: (input) => createPlanMutation.mutateAsync(input),
          });
          // Refresh dashboard inline — no navigation
          queryClient.invalidateQueries({ queryKey: ['plans'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          toast({
            title: 'Plan created!',
            description: 'Your recovery plan is ready. Check your Money Leak estimate below.',
          });
        } catch {
          toast({
            title: 'Error',
            description: 'Something went wrong generating your plan. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsGenerating(false);
        }
        break;
      }
      case 'activate':
        navigate('/plans?prompt=activate');
        break;
      case 'view_leak':
        document.getElementById('money-leak-card')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'see_results':
        navigate(latestAssessment ? `/results?id=${latestAssessment.id}` : '/results');
        break;
    }
  }, [state, latestAssessment, plans, profile, responses, sendMessage, createPlanMutation, queryClient, navigate]);

  return { buttonText, action, isGenerating, state };
}
