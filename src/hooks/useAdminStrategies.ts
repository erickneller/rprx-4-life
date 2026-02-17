import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StrategyRow {
  id: string;
  name: string;
  description: string;
  horseman_type: string;
  difficulty: string;
  estimated_impact: string | null;
  steps: unknown;
  sort_order: number;
  is_active: boolean;
  tax_return_line_or_area: string | null;
  financial_goals: string[] | null;
  strategy_summary: string | null;
  created_at: string;
}

export interface StrategyInput {
  id: string;
  name: string;
  description: string;
  horseman_type: string;
  difficulty: string;
  estimated_impact?: string;
  tax_return_line_or_area?: string;
  financial_goals?: string[];
  strategy_summary?: string;
  steps?: unknown;
  sort_order?: number;
  is_active?: boolean;
}

export function useAdminStrategies() {
  return useQuery({
    queryKey: ['admin-strategies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategy_definitions')
        .select('*')
        .order('horseman_type')
        .order('sort_order');
      if (error) throw error;
      return data as StrategyRow[];
    },
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StrategyInput) => {
      const row = {
        id: input.id,
        name: input.name,
        description: input.description,
        horseman_type: input.horseman_type,
        difficulty: input.difficulty,
        estimated_impact: input.estimated_impact || null,
        tax_return_line_or_area: input.tax_return_line_or_area || null,
        financial_goals: input.financial_goals || [],
        strategy_summary: input.strategy_summary || null,
        steps: (input.steps || []) as import('@/integrations/supabase/types').Json,
        sort_order: input.sort_order || 0,
        is_active: input.is_active ?? true,
      };
      const { data, error } = await supabase
        .from('strategy_definitions')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<StrategyInput> & { id: string }) => {
      const { id, ...rest } = input;
      const { error } = await supabase
        .from('strategy_definitions')
        .update(rest as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('strategy_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}
