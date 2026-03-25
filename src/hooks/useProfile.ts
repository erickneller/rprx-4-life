import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
  // Cash flow fields
  monthly_income: number | null;
  monthly_debt_payments: number | null;
  monthly_housing: number | null;
  monthly_insurance: number | null;
  monthly_living_expenses: number | null;
  // Optional profile fields
  profile_type: string[] | null;
  num_children: number | null;
  children_ages: number[] | null;
  financial_goals: string[] | null;
  motivation_text: string | null;
  motivation_images: string[] | null;
  filing_status: string | null;
  rprx_score: number | null;
  // Retirement fields
  years_until_retirement: number | null;
  desired_retirement_income: number | null;
  retirement_balance_total: number | null;
  retirement_contribution_monthly: number | null;
  // Insurance coverage fields
  health_insurance: boolean;
  life_insurance: boolean;
  disability_insurance: boolean;
  long_term_care_insurance: boolean;
  no_insurance: boolean;
  current_tier: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_points_earned: number;
  // Emergency savings
  emergency_fund_balance: number | null;
  // Employer match
  employer_match_captured: string | null;
  // Tax efficiency
  tax_advantaged_accounts: string[] | null;
  // Stress & control
  stress_money_worry: string | null;
  stress_emergency_confidence: string | null;
  stress_control_feeling: string | null;
  // RPRx pillar scores
  rprx_score_river: number | null;
  rprx_score_lake: number | null;
  rprx_score_rainbow: number | null;
  rprx_score_tax: number | null;
  rprx_score_stress: number | null;
  rprx_score_total: number | null;
  rprx_grade: string | null;
  // Money leak estimator
  estimated_annual_leak_low: number | null;
  estimated_annual_leak_high: number | null;
  estimated_annual_leak_recovered: number | null;
  onboarding_completed: boolean;
  ghl_contact_id: string | null;
  // Corporate accounts
  company_id: string | null;
  company_role: 'owner' | 'admin' | 'member' | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no profile exists, create one
      if (!data) {
        const metadata = user.user_metadata || {};

        // Check for pending invite token (set by /join page before signup redirect)
        let pendingCompanyId: string | null = null;
        const pendingToken = localStorage.getItem('pending_invite_token');
        if (pendingToken) {
          const { data: rpcResult } = await supabase
            .rpc('lookup_company_by_invite_token', { _token: pendingToken });
          const match = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
          if (match) {
            pendingCompanyId = match.id;
          }
        }

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: metadata.full_name || metadata.name || null,
            phone: metadata.phone || null,
            ...(pendingCompanyId ? { company_id: pendingCompanyId, company_role: 'member' } : {}),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // If we assigned a company, also create the company_members row
        if (pendingCompanyId) {
          await (supabase
            .from('company_members') as any)
            .upsert(
              { company_id: pendingCompanyId, user_id: user.id, role: 'member' },
              { onConflict: 'company_id,user_id', ignoreDuplicates: true }
            )
            .then(() => {
              localStorage.removeItem('pending_invite_token');
            });
        }

        // Sync new user to GHL (non-blocking)
        supabase.functions.invoke('ghl-sync', {
          body: {
            full_name: newProfile.full_name,
            phone: newProfile.phone,
          },
        }).catch((err) => {
          console.warn('GHL sync on signup failed (non-blocking):', err);
        });

        return newProfile as Profile;
      }

      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

      // Sync contact fields to GHL if name, phone, or email changed
      const contactFields = ['full_name', 'phone'];
      const hasContactChange = contactFields.some((f) => f in variables);
      if (hasContactChange && data) {
        supabase.functions.invoke('ghl-sync', {
          body: {
            full_name: data.full_name,
            phone: data.phone,
          },
        }).catch((err) => {
          console.warn('GHL sync failed (non-blocking):', err);
        });
      }
    },
  });

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add cache-busting parameter
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    // Update profile with new avatar URL
    await updateProfile.mutateAsync({ avatar_url: urlWithCacheBust });

    return urlWithCacheBust;
  };

  const deleteAvatar = async () => {
    if (!user?.id) throw new Error('Not authenticated');
    const currentUrl = profileQuery.data?.avatar_url;
    if (currentUrl) {
      try {
        const url = new URL(currentUrl.split('?')[0]);
        const pathParts = url.pathname.split('/storage/v1/object/public/avatars/');
        if (pathParts[1]) {
          await supabase.storage.from('avatars').remove([decodeURIComponent(pathParts[1])]);
        }
      } catch {
        // If URL parsing fails, still clear the profile field
      }
    }
    await updateProfile.mutateAsync({ avatar_url: null } as any);
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  };

  const isProfileComplete = (() => {
    const p = profileQuery.data;
    if (!p) return false;
    return !!(
      p.full_name?.trim() &&
      p.phone?.trim() &&
      p.monthly_income &&
      p.monthly_debt_payments !== null &&
      p.monthly_housing !== null &&
      p.monthly_insurance !== null &&
      p.monthly_living_expenses !== null &&
      p.emergency_fund_balance !== null &&
      p.filing_status?.trim() &&
      p.employer_match_captured?.trim() &&
      p.num_children !== null && p.num_children !== undefined &&
      p.financial_goals && p.financial_goals.length > 0 &&
      p.years_until_retirement !== null &&
      p.desired_retirement_income !== null &&
      p.retirement_balance_total !== null &&
      p.retirement_contribution_monthly !== null &&
      p.stress_money_worry?.trim() &&
      p.stress_emergency_confidence?.trim() &&
      p.stress_control_feeling?.trim() &&
      (p.health_insurance || p.life_insurance || p.disability_insurance || p.long_term_care_insurance || p.no_insurance)
    );
  })();

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isProfileComplete,
    error: profileQuery.error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  };
}
