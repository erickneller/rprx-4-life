import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DashboardCardConfig {
  id: string;
  display_name: string;
  component_key: string;
  sort_order: number;
  is_visible: boolean;
  default_size: 'full' | 'half' | 'compact';
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useDashboardConfig() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-card-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_card_config' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DashboardCardConfig[];
    },
    enabled: !!user,
  });

  return {
    cards: query.data || [],
    isLoading: query.isLoading,
  };
}

export function useUpdateCardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<DashboardCardConfig, 'is_visible' | 'default_size' | 'sort_order' | 'display_name'>> }) => {
      const { error } = await supabase
        .from('dashboard_card_config' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}

export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update sort_order for each card
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('dashboard_card_config' as any)
          .update({ sort_order: index + 1 } as any)
          .eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}
