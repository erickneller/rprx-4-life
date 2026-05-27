import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export type SubscriptionTier = 'free' | 'partner' | 'pro';

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const { data: rawTier, isLoading: subLoading, isFetched: subFetched } = useQuery({
    queryKey: ['subscription-tier', 'v2', user?.id],
    queryFn: async () => {
      if (!user) return 'free';
      const { data, error } = await supabase
        .rpc('get_subscription_tier', { _user_id: user.id });
      if (error) {
        console.error('Error fetching subscription tier:', error);
        return 'free';
      }
      const raw = (data as string) || 'free';
      return raw === 'paid' ? 'partner' : raw;
    },
    // Wait until we know admin status; admins skip this query entirely.
    enabled: !!user && !adminLoading && !isAdmin,
  });

  const normalized = rawTier === 'paid' ? 'partner' : (rawTier ?? 'free');
  const tier = (isAdmin ? 'pro' : normalized) as SubscriptionTier;

  // Loading = auth/admin still resolving, OR non-admin sub query hasn't returned
  const isLoading =
    adminLoading ||
    (!!user && !isAdmin && (subLoading || !subFetched));

  const isFree = tier === 'free';
  const isPartner = tier === 'partner';
  const isPro = tier === 'pro';
  const isPaid = isPartner || isPro;

  return {
    tier,
    isFree,
    isPartner,
    isPro,
    isPaid,
    isLoading,
  };
}
