import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { UserAssessment } from '@/lib/assessmentTypes';

export function useAssessmentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessmentHistory', user?.id],
    queryFn: async (): Promise<UserAssessment[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as unknown as UserAssessment[];
    },
    enabled: !!user,
  });
}

export function useDeleteAssessments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user || ids.length === 0) return;

      const { error } = await supabase
        .from('user_assessments')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentHistory'] });
      toast({
        title: 'Assessments deleted',
        description: 'The selected assessments have been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete assessments. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useAssessmentById(assessmentId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async (): Promise<UserAssessment | null> => {
      if (!user || !assessmentId) return null;

      const { data, error } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return data as unknown as UserAssessment;
    },
    enabled: !!user && !!assessmentId,
  });
}
