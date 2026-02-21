import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type XpConfigMap = Record<string, number>;

export function getXpForActivity(configMap: XpConfigMap, activityType: string): number {
  return configMap[activityType] ?? 0;
}

export function useActivityXpConfig() {
  const { data: xpConfig = {} } = useQuery<XpConfigMap>({
    queryKey: ['activity-xp-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_xp_config' as any)
        .select('id, base_xp, is_active')
        .eq('is_active', true);
      const map: XpConfigMap = {};
      for (const row of (data ?? []) as any[]) {
        map[row.id] = row.base_xp;
      }
      return map;
    },
    staleTime: 1000 * 60 * 30,
  });

  return xpConfig;
}
