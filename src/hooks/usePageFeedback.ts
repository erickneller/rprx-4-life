import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeedbackRow {
  id: string;
  user_id: string;
  page_route: string;
  rating: number;
  comment: string | null;
  archived: boolean;
  created_at: string;
  full_name?: string;
}

export function useSubmitFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ page_route, rating, comment }: { page_route: string; rating: number; comment?: string }) => {
      if (!user) throw new Error('Not authenticated');
      console.log('[feedback] submitting', { user_id: user.id, page_route, rating });
      const { data, error } = await supabase
        .from('page_feedback' as any)
        .insert({ user_id: user.id, page_route, rating, comment: comment || null } as any)
        .select()
        .single();
      if (error) {
        console.error('[feedback] insert error', error);
        throw error;
      }
      console.log('[feedback] inserted', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

export function useAdminFeedback() {
  return useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_feedback' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = data as any[] ?? [];
      // Fetch profile names for user_ids
      const userIds = [...new Set(rows.map((r: any) => r.user_id))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profiles) {
          nameMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name || 'Unknown']));
        }
      }

      return rows.map((r: any) => ({
        ...r,
        full_name: nameMap[r.user_id] || 'Unknown',
      })) as FeedbackRow[];
    },
  });
}

export function useArchiveFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('page_feedback' as any)
        .update({ archived } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_feedback' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}

export function useBulkDeleteArchivedFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('page_feedback' as any)
        .delete()
        .eq('archived', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
}
