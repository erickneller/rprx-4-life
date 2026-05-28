import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_FIRST_LOGIN_FLOW, type FirstLoginFlowPreset } from '@/lib/firstLoginFlow';

const FLAG_ID = 'first_login_flow';

export function useFirstLoginFlow() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', FLAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('value')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) throw error;
      return ((data as any)?.value as FirstLoginFlowPreset) || DEFAULT_FIRST_LOGIN_FLOW;
    },
    staleTime: 60_000,
  });

  return { preset: (data ?? DEFAULT_FIRST_LOGIN_FLOW) as FirstLoginFlowPreset, isLoading };
}

export function useSetFirstLoginFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: FirstLoginFlowPreset) => {
      const { error } = await supabase
        .from('feature_flags' as any)
        .update({ value, updated_at: new Date().toISOString() } as any)
        .eq('id', FLAG_ID);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag', FLAG_ID] }),
  });
}

/**
 * Reads a company's onboarding-flow override. Returns null when the company
 * hasn't set one (callers should fall back to the global preset).
 */
export function useCompanyFirstLoginFlow(companyId: string | null | undefined) {
  const enabled = !!companyId;
  const { data, isLoading } = useQuery({
    queryKey: ['company-first-login-flow', companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('companies' as any)
        .select('first_login_flow')
        .eq('id', companyId)
        .maybeSingle() as any);
      if (error) throw error;
      const v = (data as any)?.first_login_flow;
      return (v as FirstLoginFlowPreset | null) ?? null;
    },
    staleTime: 60_000,
  });
  return {
    companyPreset: (data ?? null) as FirstLoginFlowPreset | null,
    isLoading: enabled ? isLoading : false,
  };
}
