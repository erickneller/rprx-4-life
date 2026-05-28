import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FLAG_ID = 'course_banner';

export interface CourseBannerSettings {
  from: string;
  to: string;
  angle: number;
}

export const DEFAULT_COURSE_BANNER: CourseBannerSettings = {
  from: '#fed7aa',
  to: '#fef3c7',
  angle: 135,
};

function parse(value: unknown): CourseBannerSettings {
  if (typeof value !== 'string' || !value) return DEFAULT_COURSE_BANNER;
  try {
    const p = JSON.parse(value);
    return { ...DEFAULT_COURSE_BANNER, ...p };
  } catch {
    return DEFAULT_COURSE_BANNER;
  }
}

export function bannerGradientCss(s: CourseBannerSettings) {
  return `linear-gradient(${s.angle}deg, ${s.from}, ${s.to})`;
}

export function useCourseBannerSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag-value', FLAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('value')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) throw error;
      return parse((data as any)?.value);
    },
    staleTime: 60_000,
  });
  return { settings: data ?? DEFAULT_COURSE_BANNER, isLoading };
}

export function useSetCourseBannerSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: CourseBannerSettings) => {
      const { error } = await supabase
        .from('feature_flags' as any)
        .upsert(
          {
            id: FLAG_ID,
            enabled: true,
            value: JSON.stringify(settings),
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'id' },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag-value', FLAG_ID] }),
  });
}
