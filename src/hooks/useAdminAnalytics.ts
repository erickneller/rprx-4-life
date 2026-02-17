import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [usersRes, assessmentsRes, strategiesRes, badgesRes] = await Promise.all([
        supabase.rpc('admin_list_users'),
        supabase.from('user_assessments').select('id, primary_horseman, completed_at', { count: 'exact' }),
        supabase.from('user_active_strategies').select('id', { count: 'exact' }),
        supabase.from('user_badges').select('badge_id'),
      ]);

      const users = usersRes.data || [];
      const assessments = assessmentsRes.data || [];
      const totalStrategies = strategiesRes.count || 0;
      const badgeEarnings = badgesRes.data || [];

      // Recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSignups = users.filter(u => new Date(u.created_at) >= weekAgo).length;

      // Completed assessments
      const completedAssessments = assessments.filter(a => a.completed_at).length;

      // Horseman breakdown
      const horsemanCounts: Record<string, number> = { interest: 0, taxes: 0, insurance: 0, education: 0 };
      assessments.forEach(a => {
        if (a.primary_horseman && horsemanCounts[a.primary_horseman] !== undefined) {
          horsemanCounts[a.primary_horseman]++;
        }
      });

      // Badge stats
      const badgeCounts: Record<string, number> = {};
      badgeEarnings.forEach(b => {
        badgeCounts[b.badge_id] = (badgeCounts[b.badge_id] || 0) + 1;
      });
      const badgeEntries = Object.entries(badgeCounts).sort((a, b) => b[1] - a[1]);

      return {
        totalUsers: users.length,
        recentSignups,
        completedAssessments,
        totalStrategies,
        horsemanCounts,
        topBadges: badgeEntries.slice(0, 5),
        leastBadges: badgeEntries.slice(-5).reverse(),
        totalBadgesEarned: badgeEarnings.length,
      };
    },
  });
}
