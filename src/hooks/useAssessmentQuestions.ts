import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AssessmentQuestion } from '@/lib/assessmentTypes';

export function useAssessmentQuestions() {
  return useQuery({
    queryKey: ['assessmentQuestions'],
    queryFn: async (): Promise<AssessmentQuestion[]> => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      return (data || []) as unknown as AssessmentQuestion[];
    },
  });
}
