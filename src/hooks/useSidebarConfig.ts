import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NavConfigRow {
  id: string;
  label: string;
  visible: boolean;
  sort_order: number;
  updated_at: string;
  is_course?: boolean;
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
    staleTime: 60_000,
  });

  const visibilityMap = new Map<string, boolean>();
  const courseMap = new Map<string, boolean>();
  for (const row of rows) {
    visibilityMap.set(row.id, row.visible);
    courseMap.set(row.id, !!row.is_course);
  }

  const isVisible = (id: string): boolean => visibilityMap.get(id) ?? true;
  const isCourse = (id: string): boolean => courseMap.get(id) ?? false;

  return { rows, isLoading, isVisible, isCourse, visibilityMap };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] });
    },
  });
}

export function useUpdateNavIsCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCourse }: { id: string; isCourse: boolean }) => {
      const { error } = await supabase
        .from('sidebar_nav_config' as any)
        .update({ is_course: isCourse, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-nav-config'] });
    },
  });
}
