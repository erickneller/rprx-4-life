import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { DashboardCardConfig } from './useDashboardConfig';

interface UserCardOrder {
  id: string;
  user_id: string;
  card_id: string;
  sort_order: number;
}

export function mergeOrder(
  adminCards: DashboardCardConfig[],
  userOrder: UserCardOrder[]
): DashboardCardConfig[] {
  if (!userOrder.length) return adminCards;
  const orderMap = new Map(userOrder.map(o => [o.card_id, o.sort_order]));
  return [...adminCards].sort((a, b) => {
    const oa = orderMap.get(a.id) ?? a.sort_order;
    const ob = orderMap.get(b.id) ?? b.sort_order;
    return oa - ob;
  });
}

export function useUserCardOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-card-order', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_dashboard_card_order' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as UserCardOrder[];
    },
    enabled: !!user,
  });

  const saveOrder = useMutation({
    mutationFn: async (orderedCardIds: string[]) => {
      if (!user) throw new Error('Not authenticated');
      // Delete existing then insert new order
      await supabase
        .from('user_dashboard_card_order' as any)
        .delete()
        .eq('user_id', user.id);

      const rows = orderedCardIds.map((card_id, index) => ({
        user_id: user.id,
        card_id,
        sort_order: index + 1,
      }));

      const { error } = await supabase
        .from('user_dashboard_card_order' as any)
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-card-order', user?.id] });
    },
  });

  const resetOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_dashboard_card_order' as any)
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-card-order', user?.id] });
    },
  });

  return {
    userOrder: query.data || [],
    isLoading: query.isLoading,
    saveOrder,
    resetOrder,
  };
}
