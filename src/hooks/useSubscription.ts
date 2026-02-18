import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const { data: tier = 'free', isLoading: subLoading } = useQuery({
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

  const effectiveTier = isAdmin ? 'paid' : tier;

  return {
    tier: effectiveTier as 'free' | 'paid',
    isFree: effectiveTier === 'free',
    isPaid: effectiveTier === 'paid',
    isLoading: adminLoading || (!isAdmin && subLoading),
  };
}
