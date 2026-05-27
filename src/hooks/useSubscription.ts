import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export type SubscriptionTier = 'free' | 'partner' | 'pro';

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const { data: rawTier = 'free', isLoading: subLoading } = useQuery({
    queryKey: ['subscription-tier', 'v2', user?.id],
    queryFn: async () => {
      if (!user) return 'free';
      const { data, error } = await supabase
        .rpc('get_subscription_tier', { _user_id: user.id });
      if (error) {
        console.error('Error fetching subscription tier:', error);
        return 'free';
      }
      // Defensive: map any legacy 'paid' value to 'partner'
      const raw = (data as string) || 'free';
      return raw === 'paid' ? 'partner' : raw;
    },
    enabled: !!user && !isAdmin,
  });

  // Admins get top tier. Defensive normalize in case any stale cached value
  // (or future migration drift) leaks the legacy 'paid' string here.
  const normalized = rawTier === 'paid' ? 'partner' : rawTier;
  const tier = (isAdmin ? 'pro' : normalized) as SubscriptionTier;


  const isFree = tier === 'free';
  const isPartner = tier === 'partner';
  const isPro = tier === 'pro';
  // Any paying tier (partner or pro) counts as "paid" for backward-compat
  const isPaid = isPartner || isPro;

  return {
    tier,
    isFree,
    isPartner,
    isPro,
    isPaid,
    isLoading: adminLoading || (!isAdmin && subLoading),
  };
}
