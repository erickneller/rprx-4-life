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
  profile_type: string | null;
  num_children: number | null;
  children_ages: number[] | null;
  financial_goals: string[] | null;
  motivation_text: string | null;
  motivation_images: string[] | null;
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
      p.profile_type?.trim() &&
      p.financial_goals && p.financial_goals.length > 0
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
