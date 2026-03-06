import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureFlag(flagId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', flagId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('enabled')
        .eq('id', flagId)
        .single();
      if (error) throw error;
      return (data as any)?.enabled as boolean ?? true;
    },
    staleTime: 60_000,
  });

  return { enabled: data ?? true, isLoading };
}

export function useToggleFeatureFlag(flagId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('feature_flags' as any)
        .update({ enabled, updated_at: new Date().toISOString() } as any)
        .eq('id', flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flag', flagId] });
    },
  });
}
