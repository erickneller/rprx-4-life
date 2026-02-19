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
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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
      p.profile_type && p.profile_type.length > 0 &&
      p.financial_goals && p.financial_goals.length > 0 &&
      p.filing_status?.trim() &&
      p.num_children !== null && p.num_children !== undefined &&
      p.years_until_retirement !== null &&
      p.desired_retirement_income !== null &&
      p.retirement_balance_total !== null &&
      p.retirement_contribution_monthly !== null &&
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
  };
}
