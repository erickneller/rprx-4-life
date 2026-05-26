import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface HealthAssessmentRecord {
  id: string;
  user_id: string;
  persona: string | null;
  primary_horseman: string | null;
  secondary_horseman: string | null;
  recommended_track: string | null;
  recommended_track_name: string | null;
  readiness_score: number | null;
  readiness_label: string | null;
  horseman_scores: Record<string, number>;
  quick_wins: string[];
  weekly_focus: { week: string; goal: string }[];
  snapshot: Record<string, unknown>;
  basic_profile: Record<string, unknown>;
  health_habits: Record<string, unknown>;
  screenings: Record<string, unknown>;
  goals: Record<string, unknown>;
  contact: Record<string, unknown>;
  bmi: number | null;
  created_at: string;
  updated_at: string;
}

export function useHealthAssessments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['healthAssessments', user?.id],
    queryFn: async (): Promise<HealthAssessmentRecord[]> => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('user_health_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as HealthAssessmentRecord[];
    },
    enabled: !!user,
  });
}

export function useDeleteHealthAssessment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      const { error } = await (supabase as any)
        .from('user_health_assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthAssessments'] });
      toast({ title: 'Health assessment deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    },
  });
}
