import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { calculateRPRxScore, type RPRxScoreResult, type StrategyData } from '@/lib/rprxScoreEngine';

export function useRPRxScore() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const queryClient = useQueryClient();
  const lastPersistedTotal = useRef<number | null>(null);

  // Fetch strategy data
  const { data: strategyData } = useQuery({
    queryKey: ['rprx-strategy-data', user?.id],
    queryFn: async (): Promise<StrategyData> => {
      if (!user?.id) return { activatedCount: 0, completedCount: 0, completedByHorseman: { interest: 0, taxes: 0, insurance: 0, education: 0 }, deepDiveCompleted: false, taxDeepDiveAnswers: null };

      const [
        { data: activeStrategies },
        { data: deepDives },
      ] = await Promise.all([
        supabase
          .from('user_active_strategies')
          .select('strategy_id, status')
          .eq('user_id', user.id),
        supabase
          .from('user_deep_dives')
          .select('horseman_type, answers')
          .eq('user_id', user.id),
      ]);

      const strategies = activeStrategies ?? [];
      const activatedCount = strategies.length;
      const completedIds = strategies.filter(s => s.status === 'completed').map(s => s.strategy_id);

      // Get horseman types for completed strategies
      const completedByHorseman = { interest: 0, taxes: 0, insurance: 0, education: 0 };
      if (completedIds.length > 0) {
        const { data: defs } = await supabase
          .from('strategy_definitions')
          .select('id, horseman_type')
          .in('id', completedIds);
        for (const def of defs ?? []) {
          const h = def.horseman_type as keyof typeof completedByHorseman;
          if (h in completedByHorseman) completedByHorseman[h]++;
        }
      }

      const dives = deepDives ?? [];
      const deepDiveCompleted = dives.length > 0;
      const taxDive = dives.find(d => d.horseman_type === 'taxes');

      return {
        activatedCount,
        completedCount: completedIds.length,
        completedByHorseman,
        deepDiveCompleted,
        taxDeepDiveAnswers: taxDive?.answers ?? null,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Calculate score
  const scoreResult: RPRxScoreResult | null = useMemo(() => {
    if (!profile || !strategyData) return null;
    return calculateRPRxScore(profile, strategyData);
  }, [profile, strategyData]);

  // Persist score to profile when it changes
  useEffect(() => {
    if (!scoreResult || !profile) return;
    if (scoreResult.total === lastPersistedTotal.current) return;
    // Don't persist if the profile already matches
    if (
      profile.rprx_score_total === scoreResult.total &&
      profile.rprx_grade === scoreResult.grade
    ) {
      lastPersistedTotal.current = scoreResult.total;
      return;
    }

    lastPersistedTotal.current = scoreResult.total;
    updateProfile.mutate({
      rprx_score: scoreResult.total,
      rprx_score_river: scoreResult.river,
      rprx_score_lake: scoreResult.lake,
      rprx_score_rainbow: scoreResult.rainbow,
      rprx_score_tax: scoreResult.tax,
      rprx_score_stress: scoreResult.stress,
      rprx_score_total: scoreResult.total,
      rprx_grade: scoreResult.grade,
      current_tier: scoreResult.grade,
    } as any);
  }, [scoreResult?.total, scoreResult?.grade]);

  const refreshScore = useCallback(() => {
    if (!user?.id) return;
    queryClient.invalidateQueries({ queryKey: ['rprx-strategy-data', user.id] });
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  }, [user?.id, queryClient]);

  return {
    score: scoreResult,
    isLoading: !scoreResult,
    refreshScore,
  };
}
