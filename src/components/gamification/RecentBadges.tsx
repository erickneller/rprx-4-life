import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';
import { useProfile } from '@/hooks/useProfile';

export function RecentBadges() {
  const { badges } = useGamification();
  const { profile } = useProfile();
  const totalXP = profile?.total_points_earned ?? 0;

  const recentThree = useMemo(
    () => badges.earned.slice(0, 3),
    [badges.earned]
  );

  if (recentThree.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b">
          <span className="text-lg">⭐</span>
          <span className="text-xl font-bold text-foreground">{totalXP.toLocaleString()} XP</span>
        </div>
        <div className="flex flex-col gap-2">
          {recentThree.map((badge) => {
            const def = badges.available.find((b) => b.id === badge.badge_id);
            return (
              <div key={badge.id} className="flex items-center gap-3 rounded-md border p-2">
                <span className="text-xl">{def?.icon ?? '🏆'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{def?.name ?? badge.badge_id}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(badge.earned_at).toLocaleDateString()} · +{badge.points_awarded} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
