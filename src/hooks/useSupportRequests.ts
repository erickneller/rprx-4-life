import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SupportRequestType = 'help' | 'bug' | 'feature' | 'advisor';
export type SupportRequestStatus = 'new' | 'in_progress' | 'resolved' | 'archived';

export interface SupportRequestRow {
  id: string;
  user_id: string;
  type: SupportRequestType;
  subject: string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: SupportRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

export function useSubmitSupportRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: SupportRequestType;
      subject: string;
      message: string;
      page_url?: string;
      user_agent?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await (supabase.from('support_requests' as any) as any)
        .insert({
          user_id: user.id,
          type: input.type,
          subject: input.subject,
          message: input.message,
          page_url: input.page_url ?? null,
          user_agent: input.user_agent ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-support-requests'] });
    },
  });
}

export function useMySupportRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-support-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from('support_requests' as any) as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportRequestRow[];
    },
  });
}

export function useAdminSupportRequests() {
  return useQuery({
    queryKey: ['admin-support-requests'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('support_requests' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profiles) nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || 'Unknown']));
      }
      return rows.map((r) => ({ ...r, full_name: nameMap[r.user_id] || 'Unknown' })) as SupportRequestRow[];
    },
  });
}

export function useUpdateSupportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: SupportRequestStatus; admin_notes?: string }) => {
      const { error } = await (supabase.from('support_requests' as any) as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-support-requests'] }),
  });
}

export function useDeleteSupportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('support_requests' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-support-requests'] }),
  });
}
