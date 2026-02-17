import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type AssessmentQuestionRow = Tables<'assessment_questions'>;
export type AssessmentQuestionInsert = TablesInsert<'assessment_questions'>;
export type AssessmentQuestionUpdate = TablesUpdate<'assessment_questions'>;

export type DeepDiveQuestionRow = Tables<'deep_dive_questions'>;
export type DeepDiveQuestionInsert = TablesInsert<'deep_dive_questions'>;
export type DeepDiveQuestionUpdate = TablesUpdate<'deep_dive_questions'>;

// --- Assessment Questions ---
export function useAdminAssessmentQuestions() {
  return useQuery({
    queryKey: ['admin-assessment-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssessmentQuestionInsert) => {
      const { error } = await supabase.from('assessment_questions').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assessment-questions'] }),
  });
}

export function useUpdateAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: AssessmentQuestionUpdate & { id: string }) => {
      const { error } = await supabase.from('assessment_questions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assessment-questions'] }),
  });
}

export function useDeleteAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assessment_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assessment-questions'] }),
  });
}

// --- Deep Dive Questions ---
export function useAdminDeepDiveQuestions() {
  return useQuery({
    queryKey: ['admin-deepdive-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deep_dive_questions')
        .select('*')
        .order('horseman_type')
        .order('order_index');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDeepDiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeepDiveQuestionInsert) => {
      const { error } = await supabase.from('deep_dive_questions').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deepdive-questions'] }),
  });
}

export function useUpdateDeepDiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: DeepDiveQuestionUpdate & { id: string }) => {
      const { error } = await supabase.from('deep_dive_questions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deepdive-questions'] }),
  });
}

export function useDeleteDeepDiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deep_dive_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deepdive-questions'] }),
  });
}
