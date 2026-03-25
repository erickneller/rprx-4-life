import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdvisorLinkData {
  enabled: boolean;
  url: string;
}

export function useAdvisorLink() {
  const { data, isLoading } = useQuery({
    queryKey: ['advisor-link'],
    queryFn: async (): Promise<AdvisorLinkData> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled, value')
        .eq('id', 'advisor_link')
        .single();
      if (error) throw error;
      return {
        enabled: data?.enabled ?? false,
        url: (data as any)?.value ?? '',
      };
    },
    staleTime: 60_000,
  });

  return {
    enabled: data?.enabled ?? false,
    url: data?.url ?? '',
    isLoading,
  };
}

export function useUpdateAdvisorLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enabled, value }: { enabled?: boolean; value?: string }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (enabled !== undefined) updates.enabled = enabled;
      if (value !== undefined) updates.value = value;

      const { error } = await supabase
        .from('feature_flags' as any)
        .update(updates as any)
        .eq('id', 'advisor_link');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-link'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag', 'advisor_link'] });
    },
  });
}
