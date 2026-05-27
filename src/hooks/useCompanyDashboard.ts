import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';

export type SubscriptionPlan = 'free' | 'partner' | 'pro';

export interface CompanyMemberStats {
  user_id: string;
  full_name: string | null;
  joined_at: string;
  last_active_date: string | null;
  current_streak: number;
  current_tier: string;
  subscription_tier: SubscriptionPlan;
  onboarding_completed: boolean;
  has_assessment: boolean;
  total_points_earned: number;
}

function normalizePlan(raw: unknown): SubscriptionPlan {
  const v = (raw as string) || 'free';
  if (v === 'paid' || v === 'partner') return 'partner';
  if (v === 'pro') return 'pro';
  return 'free';
}

export function useCompanyDashboard() {
  const { company, membership } = useCompany();
  const isCompanyAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  const { data: members = [], isLoading } = useQuery<CompanyMemberStats[]>({
    queryKey: ['company-dashboard', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await (supabase.rpc as any)('company_dashboard_stats', {
        _company_id: company.id,
      });
      if (error) throw error;
      return (data ?? []) as CompanyMemberStats[];
    },
    enabled: !!company?.id && isCompanyAdmin,
  });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    totalMembers: members.length,
    activeThisWeek: members.filter(m => m.last_active_date && new Date(m.last_active_date) >= weekAgo).length,
    assessmentsCompleted: members.filter(m => m.has_assessment).length,
    onboardingCompleted: members.filter(m => m.onboarding_completed).length,
  };

  return { company, membership, isCompanyAdmin, members, stats, isLoading };
}
