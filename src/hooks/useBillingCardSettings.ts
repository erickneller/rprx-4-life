import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FLAG_ID = 'billing_card';

export interface BillingCardCopy {
  title: string;
  description: string;
  upgradeLabel: string;
  changeLabel: string;
  supportLabel: string;
  supportEmail: string;
  /** Supports {email} placeholder. */
  footerNote: string;
}

export const DEFAULT_BILLING_CARD_COPY: BillingCardCopy = {
  title: 'Billing & Subscription',
  description: 'Manage your RPRx plan.',
  upgradeLabel: 'Upgrade Plan',
  changeLabel: 'Change Plan',
  supportLabel: 'Manage via Support',
  supportEmail: 'support@rprx4life.com',
  footerNote: 'To cancel or change payment method, email {email}.',
};

function parseCopy(value: unknown): BillingCardCopy {
  if (typeof value !== 'string' || !value) return DEFAULT_BILLING_CARD_COPY;
  try {
    const parsed = JSON.parse(value);
    return { ...DEFAULT_BILLING_CARD_COPY, ...parsed };
  } catch {
    return DEFAULT_BILLING_CARD_COPY;
  }
}

export function useBillingCardSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag-value', FLAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('enabled, value')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) throw error;
      const row = data as any;
      return {
        enabled: row?.enabled ?? true,
        copy: parseCopy(row?.value),
      };
    },
    staleTime: 60_000,
  });

  return {
    enabled: data?.enabled ?? true,
    copy: data?.copy ?? DEFAULT_BILLING_CARD_COPY,
    isLoading,
  };
}

export function useSetBillingCardSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { enabled?: boolean; copy?: BillingCardCopy }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.enabled !== undefined) update.enabled = patch.enabled;
      if (patch.copy !== undefined) update.value = JSON.stringify(patch.copy);
      const { error } = await supabase
        .from('feature_flags' as any)
        .update(update as any)
        .eq('id', FLAG_ID);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag-value', FLAG_ID] }),
  });
}
