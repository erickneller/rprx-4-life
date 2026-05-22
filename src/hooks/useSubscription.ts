import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export type SubscriptionTier = 'free' | 'paid' | 'partner' | 'pro';

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const { data: rawTier = 'free', isLoading: subLoading } = useQuery({
    queryKey: ['subscription-tier', user?.id],
    queryFn: async () => {
      if (!user) return 'free';
      const { data, error } = await supabase
        .rpc('get_subscription_tier', { _user_id: user.id });
      if (error) {
        console.error('Error fetching subscription tier:', error);
        return 'free';
      }
      return (data as string) || 'free';
    },
    enabled: !!user && !isAdmin,
  });

  // Admins get top tier
  const tier = (isAdmin ? 'pro' : rawTier) as SubscriptionTier;

  const isFree = tier === 'free';
  const isPartner = tier === 'partner';
  const isPro = tier === 'pro';
  // Backward-compat: any paying tier counts as "paid"
  const isPaid = tier === 'paid' || isPartner || isPro;

  return {
    tier,
    isFree,
    isPartner,
    isPro,
    isPaid,
    isLoading: adminLoading || (!isAdmin && subLoading),
  };
}
