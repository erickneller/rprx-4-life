import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BadgeRow = Tables<'badge_definitions'>;
export type BadgeInsert = TablesInsert<'badge_definitions'>;
export type BadgeUpdate = TablesUpdate<'badge_definitions'>;

export function useAdminBadges() {
  return useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BadgeInsert) => {
      const { error } = await supabase.from('badge_definitions').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-badges'] }),
  });
}

export function useUpdateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: BadgeUpdate & { id: string }) => {
      const { error } = await supabase.from('badge_definitions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-badges'] }),
  });
}

export function useDeleteBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('badge_definitions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-badges'] }),
  });
}
