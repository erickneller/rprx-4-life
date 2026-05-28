import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_FIRST_LOGIN_FLOW, type FirstLoginFlowPreset } from '@/lib/firstLoginFlow';

const FLAG_ID = 'first_login_flow';

export function normalizeOnboardingPath(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  if (raw.startsWith('/')) return raw;
  const lower = raw.toLowerCase();
  // Map known preset/keyword values to concrete routes
  if (lower === 'dashboard' || lower === 'dashboard_silent' || lower === 'dashboard_nudge') {
    return '/dashboard';
  }
  if (lower === 'wizard' || lower === 'profile' || lower === 'profile_only' || lower === 'profile_then_assessment') {
    return '/wizard';
  }
  if (lower === 'assessment' || lower === 'assessment_only' || lower === 'assessment_then_profile') {
    return '/assessment';
  }
  return null;
}

function toOnboardingPath(value: unknown): string | null {
  return normalizeOnboardingPath(value);
}

export function useFirstLoginFlow() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag-value', FLAG_ID],
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

  return {
    preset: (data ?? DEFAULT_FIRST_LOGIN_FLOW) as FirstLoginFlowPreset,
    globalRaw: (data ?? null) as string | null,
    globalPath: toOnboardingPath(data),
    isLoading,
  };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag-value', FLAG_ID] }),
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
    companyOverrideEnabled: data != null,
    companyOverridePath: toOnboardingPath(data),
    isLoading: enabled ? isLoading : false,
  };
}
