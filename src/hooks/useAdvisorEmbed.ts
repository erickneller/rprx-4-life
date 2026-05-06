import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdvisorEmbed() {
  const { data, isLoading } = useQuery({
    queryKey: ['advisor-embed'],
    queryFn: async (): Promise<string> => {
      const { data, error } = await (supabase as any)
        .from('feature_flags')
        .select('value')
        .eq('id', 'advisor_embed')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as string) ?? '';
    },
    staleTime: 60_000,
  });

  return { embed: data ?? '', isLoading };
}

export function useUpdateAdvisorEmbed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: string) => {
      const { data: existing } = await (supabase as any)
        .from('feature_flags')
        .select('id')
        .eq('id', 'advisor_embed')
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('feature_flags')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('id', 'advisor_embed');
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('feature_flags')
          .insert({ id: 'advisor_embed', value, enabled: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-embed'] });
    },
  });
}
