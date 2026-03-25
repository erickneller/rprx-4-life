import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserGuideSection {
  id: string;
  title: string;
  body: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserGuide(activeOnly = false) {
  return useQuery({
    queryKey: ['user-guide-sections', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('user_guide_sections' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as UserGuideSection[];
    },
  });
}
