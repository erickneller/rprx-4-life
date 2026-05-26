import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LandingCardRow } from '@/lib/landingCards';

const KEY = ['landing-card-config'];

export function useLandingCards() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('landing_card_config')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as LandingCardRow[];
    },
    staleTime: 5 * 60_000,
  });
}

type UpdatePayload = Partial<Pick<LandingCardRow, 'is_visible' | 'display_name' | 'content' | 'sort_order'>>;

export function useUpdateLandingCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdatePayload }) => {
      const { error } = await (supabase as any)
        .from('landing_card_config')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderLandingCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) =>
        (supabase as any).from('landing_card_config').update({ sort_order: (idx + 1) * 10 }).eq('id', id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r: any) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
