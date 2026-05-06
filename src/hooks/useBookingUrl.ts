import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FLAG_ID = 'physical_advisor_booking_url';
const FALLBACK = 'https://YOUR-BOOKING-LINK-HERE.com';

export function useBookingUrl() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', FLAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('value, enabled')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) throw error;
      return {
        url: ((data as any)?.value as string) || FALLBACK,
        enabled: (data as any)?.enabled ?? true,
      };
    },
    staleTime: 60_000,
  });
  return { url: data?.url ?? FALLBACK, enabled: data?.enabled ?? true, isLoading };
}

export function useUpdateBookingUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from('feature_flags' as any)
        .upsert({ id: FLAG_ID, value, enabled: true, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag', FLAG_ID] }),
  });
}
