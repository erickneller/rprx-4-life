import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileFieldSetting {
  field_key: string;
  label: string;
  section: string;
  visible: boolean;
  required: boolean;
  sort_order: number;
}

export function useProfileFieldSettings() {
  const q = useQuery({
    queryKey: ['profile_field_settings'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProfileFieldSetting[]> => {
      const { data, error } = await (supabase as any)
        .from('profile_field_settings')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ProfileFieldSetting[];
    },
  });

  const map = new Map<string, ProfileFieldSetting>();
  (q.data || []).forEach((s) => map.set(s.field_key, s));

  // Default to visible/optional when no row exists, so adding new fields never breaks the UI.
  const isVisible = (key: string) => map.get(key)?.visible ?? true;
  const isRequired = (key: string) => {
    const s = map.get(key);
    if (!s) return false;
    return s.visible && s.required;
  };
  const bySection = (section: string) =>
    (q.data || []).filter((s) => s.section === section);

  return { ...q, settings: q.data || [], isVisible, isRequired, bySection };
}
