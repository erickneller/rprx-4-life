import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CustomCardContentType = 'video' | 'embed' | 'text' | 'image';

export interface CustomCardContent {
  url?: string;
  caption?: string;
  markdown?: string;
  html?: string;
  alt?: string;
  link?: string;
}

export interface DashboardCardConfig {
  id: string;
  display_name: string;
  component_key: string;
  sort_order: number;
  is_visible: boolean;
  default_size: 'full' | 'half' | 'compact';
  description: string | null;
  created_at: string;
  updated_at: string;
  is_custom: boolean;
  title: string | null;
  content_type: CustomCardContentType | null;
  content: CustomCardContent;
  audience_company_ids: string[];
  audience_tiers: string[];
}

export interface CustomCardInput {
  title: string;
  content_type: CustomCardContentType;
  content: CustomCardContent;
  default_size?: 'full' | 'half' | 'compact';
  is_visible?: boolean;
  audience_company_ids?: string[];
  audience_tiers?: string[];
}

export function useDashboardConfig() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-card-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_card_config' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DashboardCardConfig[];
    },
    enabled: !!user,
  });

  return {
    cards: query.data || [],
    isLoading: query.isLoading,
  };
}

type UpdatableFields = Partial<
  Pick<
    DashboardCardConfig,
    | 'is_visible'
    | 'default_size'
    | 'sort_order'
    | 'display_name'
    | 'title'
    | 'content_type'
    | 'content'
    | 'audience_company_ids'
    | 'audience_tiers'
  >
>;

export function useUpdateCardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdatableFields }) => {
      const { error } = await supabase
        .from('dashboard_card_config' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}

export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('dashboard_card_config' as any)
          .update({ sort_order: index + 1 } as any)
          .eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}

export function useCreateCustomCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomCardInput) => {
      const slug = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const row = {
        id: slug,
        display_name: input.title,
        title: input.title,
        component_key: 'CustomCard',
        is_custom: true,
        content_type: input.content_type,
        content: input.content,
        default_size: input.default_size ?? 'full',
        is_visible: input.is_visible ?? true,
        sort_order: 999,
        audience_company_ids: input.audience_company_ids ?? [],
        audience_tiers: input.audience_tiers ?? [],
      };
      const { error } = await supabase.from('dashboard_card_config' as any).insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}

export function useDeleteCustomCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dashboard_card_config' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-config'] });
    },
  });
}
