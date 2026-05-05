import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LinkType = 'route' | 'external' | 'course' | 'coming_soon';

export interface NavConfigRow {
  id: string;
  label: string;
  visible: boolean;
  sort_order: number;
  updated_at: string;
  is_course: boolean;
  kind: 'section' | 'item';
  parent_id: string | null;
  icon: string | null;
  url: string | null;
  link_type: LinkType;
  is_system: boolean;
}

export function useSidebarConfig() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['sidebar-nav-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sidebar_nav_config' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as NavConfigRow[];
    },
    staleTime: 30_000,
  });

  const visibilityMap = new Map<string, boolean>();
  const courseMap = new Map<string, boolean>();
  for (const row of rows) {
    visibilityMap.set(row.id, row.visible);
    courseMap.set(row.id, row.link_type === 'course' || !!row.is_course);
  }

  const isVisible = (id: string): boolean => visibilityMap.get(id) ?? true;
  const isCourse = (id: string): boolean => courseMap.get(id) ?? false;

  // Tree structure
  const sections = rows.filter(r => r.kind === 'section').sort((a, b) => a.sort_order - b.sort_order);
  const orphanItems = rows.filter(r => r.kind === 'item' && !r.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const itemsBySection = new Map<string, NavConfigRow[]>();
  for (const row of rows) {
    if (row.kind === 'item' && row.parent_id) {
      const arr = itemsBySection.get(row.parent_id) || [];
      arr.push(row);
      itemsBySection.set(row.parent_id, arr);
    }
  }
  for (const arr of itemsBySection.values()) arr.sort((a, b) => a.sort_order - b.sort_order);

  return { rows, isLoading, isVisible, isCourse, visibilityMap, sections, orphanItems, itemsBySection };
}

export function useUpdateNavVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from('sidebar_nav_config' as any)
        .update({ visible, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] }),
  });
}

export function useUpdateNavIsCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCourse }: { id: string; isCourse: boolean }) => {
      const { error } = await supabase
        .from('sidebar_nav_config' as any)
        .update({
          is_course: isCourse,
          link_type: isCourse ? 'course' : 'route',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] }),
  });
}

export function useUpsertNavRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<NavConfigRow> & { id: string }) => {
      const payload: any = {
        ...row,
        is_course: row.link_type ? row.link_type === 'course' : row.is_course,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('sidebar_nav_config' as any)
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] }),
  });
}

export function useDeleteNavRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Cascade: if it's a section, delete its items first; if course-typed item, delete course rows
      const { data: row } = await supabase
        .from('sidebar_nav_config' as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      const r = row as any;
      if (r?.is_system) throw new Error('Cannot delete a system item');
      if (r?.kind === 'section') {
        await supabase.from('sidebar_nav_config' as any).delete().eq('parent_id', id);
      }
      await supabase.from('courses' as any).delete().eq('nav_config_id', id);
      const { error } = await supabase.from('sidebar_nav_config' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] }),
  });
}

export function useSwapNavOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ a, b }: { a: NavConfigRow; b: NavConfigRow }) => {
      // Swap sort_order between two rows
      const { error: e1 } = await supabase
        .from('sidebar_nav_config' as any)
        .update({ sort_order: b.sort_order, updated_at: new Date().toISOString() } as any)
        .eq('id', a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('sidebar_nav_config' as any)
        .update({ sort_order: a.sort_order, updated_at: new Date().toISOString() } as any)
        .eq('id', b.id);
      if (e2) throw e2;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] }),
  });
}
