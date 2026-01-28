import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
