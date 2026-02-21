import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useActivityXpConfig, getXpForActivity } from './useActivityXpConfig';
import {
  type ActivityType,
  type AwardedBadge,
  type TierInfo,
  getTier,
  checkAndAwardBadges,
  recalculateAndPersistScore,
  updateStreak,
  getProfileCompleteness,
} from '@/lib/gamification';

export function useGamification() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const xpConfig = useActivityXpConfig();
  const streakChecked = useRef(false);

  const [recentlyEarned, setRecentlyEarned] = useState<AwardedBadge[]>([]);

  // Badge definitions
  const { data: allBadges = [] } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Earned badges
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Derived score + tier
  const rprxScore = profile?.rprx_score ?? 0;
  const tier: TierInfo = getTier(rprxScore);

  const streak = {
    current: profile?.current_streak ?? 0,
    longest: profile?.longest_streak ?? 0,
    isActive: profile?.last_active_date === new Date().toISOString().slice(0, 10),
  };

  // Track streak on mount (once per session)
  useEffect(() => {
    if (!user?.id || streakChecked.current) return;
    streakChecked.current = true;

    updateStreak(user.id).then(({ badgesEarned }) => {
      if (badgesEarned.length > 0) {
        setRecentlyEarned((prev) => [...badgesEarned, ...prev]);
        queryClient.invalidateQueries({ queryKey: ['user-badges', user.id] });
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    });
  }, [user?.id, queryClient]);

  // Log activity + check badges
  const logActivity = useCallback(
    async (action: ActivityType, context?: Record<string, unknown>): Promise<{ awarded: AwardedBadge[]; xpEarned: number }> => {
      if (!user?.id) return { awarded: [], xpEarned: 0 };

      const activityXp = getXpForActivity(xpConfig, action);

      // Log the activity with config-driven XP
      await supabase.from('user_activity_log').insert([{
        user_id: user.id,
        activity_type: action,
        activity_data: (context as Record<string, string | number | boolean | null>) ?? null,
        points_earned: activityXp,
      }]);

      // Increment total_points_earned on profile
      if (activityXp > 0) {
        const currentTotal = profile?.total_points_earned ?? 0;
        await supabase
          .from('profiles')
          .update({ total_points_earned: currentTotal + activityXp })
          .eq('id', user.id);
      }

      // Check and award badges
      const awarded = await checkAndAwardBadges(user.id, action, context);

      if (awarded.length > 0) {
        setRecentlyEarned((prev) => [...awarded, ...prev]);
      }

      // Always recalculate score
      await recalculateAndPersistScore(user.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-badges', user.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      return { awarded, xpEarned: activityXp };
    },
    [user?.id, queryClient, xpConfig, profile?.total_points_earned]
  );

  const refreshScore = useCallback(async () => {
    if (!user?.id) return;
    await recalculateAndPersistScore(user.id);
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  }, [user?.id, queryClient]);

  const clearRecentlyEarned = useCallback(() => {
    setRecentlyEarned([]);
  }, []);

  return {
    rprxScore,
    tier,
    streak,
    badges: {
      earned: earnedBadges,
      available: allBadges,
      recentlyEarned,
    },
    logActivity,
    refreshScore,
    clearRecentlyEarned,
  };
}
