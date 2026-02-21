import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePlans, useFocusPlan } from './usePlans';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { calculateMoneyLeak, type MoneyLeakResult } from '@/lib/moneyLeakEstimator';

export function useMoneyLeak() {
  const { user } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: focusPlan = null, isLoading: focusLoading } = useFocusPlan();
  const queryClient = useQueryClient();

  // Check if user has completed at least one assessment
  const { data: hasAssessment = false, isLoading: assessmentLoading } = useQuery({
    queryKey: ['has-assessment', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count } = await supabase
        .from('user_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  const result = useMemo<MoneyLeakResult | null>(() => {
    if (plans.length === 0) return null;
    return calculateMoneyLeak(plans, focusPlan);
  }, [plans, focusPlan]);

  // Persist to profiles when result changes
  const persistLeak = useCallback(async (leak: MoneyLeakResult) => {
    if (!user?.id) return;
    await supabase
      .from('profiles')
      .update({
        estimated_annual_leak_low: leak.totalLeakLow,
        estimated_annual_leak_high: leak.totalLeakHigh,
        estimated_annual_leak_recovered: leak.totalRecovered,
      })
      .eq('id', user.id);
  }, [user?.id]);

  // Persist whenever result changes
  useMemo(() => {
    if (result) persistLeak(result);
  }, [result, persistLeak]);

  const refreshLeak = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  }, [queryClient]);

  // Determine card state
  const hasPlans = plans.length > 0;
  const hasFocusPlan = !!focusPlan;

  return {
    result,
    focusedPlan: focusPlan,
    isLoading: plansLoading || focusLoading || assessmentLoading,
    hasAssessment,
    hasPlans,
    hasFocusPlan,
    refreshLeak,
  };
}
