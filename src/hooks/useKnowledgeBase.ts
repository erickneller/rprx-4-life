import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KnowledgeBaseEntry {
  id: string;
  name: string;
  description: string;
  source_url: string;
  content: string;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  return useQuery({
    queryKey: ['knowledge-base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as KnowledgeBaseEntry[];
    },
  });
}

export function useCreateKBEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Pick<KnowledgeBaseEntry, 'id' | 'name' | 'description' | 'source_url'>) => {
      const { error } = await supabase.from('knowledge_base' as any).insert(entry as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });
}

export function useUpdateKBEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeBaseEntry> & { id: string }) => {
      const { error } = await supabase.from('knowledge_base' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });
}

export function useDeleteKBEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_base' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });
}

export function useSyncKBEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source_url }: { id: string; source_url: string }) => {
      const { data, error } = await supabase.functions.invoke('sync-knowledge-base', {
        body: { id, source_url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });
}
