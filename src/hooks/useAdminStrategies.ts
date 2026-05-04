import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

/**
 * Admin strategy hooks.
 *
 * Source of truth: `strategy_catalog_v2`.
 * The legacy `strategy_definitions` table was replaced by a read-only view in
 * the 2026-05 reconciliation migration. All writes here go to v2; reads also
 * pull from v2 and are projected into the legacy `StrategyRow` shape so
 * existing consumers (admin Strategies tab, etc.) keep working unchanged.
 */

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
  steps?: unknown;
  sort_order?: number;
  is_active?: boolean;
}

// Map a v2 row → the legacy StrategyRow shape the UI expects.
function v2ToRow(v: any): StrategyRow {
  const goals = Array.isArray(v.who_best_for)
    ? (v.who_best_for as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  return {
    id: v.id,
    name: v.title ?? '',
    description: v.strategy_details ?? '',
    horseman_type: v.horseman_type,
    difficulty: v.difficulty ?? 'moderate',
    estimated_impact: v.estimated_impact_display ?? null,
    steps: v.implementation_steps ?? [],
    sort_order: v.sort_order ?? 0,
    is_active: !!v.is_active,
    tax_return_line_or_area: v.tax_return_line_or_area ?? null,
    financial_goals: goals,
    created_at: v.created_at,
  };
}

// Map a StrategyInput → a v2 row (for insert/upsert).
function inputToV2(input: StrategyInput) {
  return {
    id: input.id,
    strategy_id: input.id,
    title: input.name,
    strategy_details: input.description,
    horseman_type: input.horseman_type,
    difficulty: input.difficulty,
    estimated_impact_display: input.estimated_impact || null,
    tax_return_line_or_area: input.tax_return_line_or_area || null,
    who_best_for: ((input.financial_goals || []) as unknown) as Json,
    implementation_steps: ((input.steps || []) as unknown) as Json,
    sort_order: input.sort_order || 0,
    is_active: input.is_active ?? true,
  };
}

// Map a partial StrategyInput → a v2 update patch.
function partialInputToV2(input: Partial<StrategyInput>) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.title = input.name;
  if (input.description !== undefined) patch.strategy_details = input.description;
  if (input.horseman_type !== undefined) patch.horseman_type = input.horseman_type;
  if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
  if (input.estimated_impact !== undefined)
    patch.estimated_impact_display = input.estimated_impact || null;
  if (input.tax_return_line_or_area !== undefined)
    patch.tax_return_line_or_area = input.tax_return_line_or_area || null;
  if (input.financial_goals !== undefined) patch.who_best_for = input.financial_goals;
  if (input.steps !== undefined) patch.implementation_steps = input.steps;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  return patch;
}

export function useAdminStrategies() {
  return useQuery({
    queryKey: ['admin-strategies'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .select(
          'id,title,strategy_details,horseman_type,difficulty,estimated_impact_display,implementation_steps,sort_order,is_active,tax_return_line_or_area,who_best_for,created_at'
        )
        .order('horseman_type')
        .order('sort_order');
      if (error) throw error;
      return ((data as any[]) ?? []).map(v2ToRow);
    },
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StrategyInput) => {
      const row = inputToV2(input);
      const { data, error } = await (supabase as any)
        .from('strategy_catalog_v2')
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
      const patch = partialInputToV2(rest);
      const { error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .update(patch)
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
      const { error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}

export function useDeleteStrategies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}

export function useImportStrategies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: StrategyInput[]) => {
      const mapped = rows.map(inputToV2);
      const { error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .upsert(mapped, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}

export function useBulkToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (active: boolean) => {
      const { error } = await (supabase as any)
        .from('strategy_catalog_v2')
        .update({ is_active: active })
        .neq('id', '___never_match___'); // updates all rows
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-strategies'] }),
  });
}
