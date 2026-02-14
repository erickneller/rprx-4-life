import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { HorsemanType } from '@/lib/scoringEngine';

export interface DeepDiveQuestion {
  id: string;
  horseman_type: string;
  question_text: string;
  question_type: string;
  options: { value: string; label: string; score: number }[];
  order_index: number;
}

export function useDeepDiveQuestions(horsemanType: HorsemanType | null) {
  return useQuery({
    queryKey: ['deep_dive_questions', horsemanType],
    queryFn: async () => {
      if (!horsemanType) return [];
      const { data, error } = await supabase
        .from('deep_dive_questions')
        .select('*')
        .eq('horseman_type', horsemanType)
        .order('order_index');
      if (error) throw error;
      return (data ?? []) as unknown as DeepDiveQuestion[];
    },
    enabled: !!horsemanType,
  });
}

export function useExistingDeepDive(assessmentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_deep_dive', assessmentId],
    queryFn: async () => {
      if (!user?.id || !assessmentId) return null;
      const { data, error } = await supabase
        .from('user_deep_dives')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!assessmentId,
  });
}

export function useSaveDeepDive() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      assessmentId: string;
      horsemanType: string;
      answers: Record<string, string | string[]>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_deep_dives')
        .insert({
          user_id: user.id,
          assessment_id: params.assessmentId,
          horseman_type: params.horsemanType,
          answers: params.answers,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user_deep_dive', vars.assessmentId] });
    },
  });
}
