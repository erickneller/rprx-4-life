import { Flame, Star } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function DashboardStreakBar() {
  const { profile } = useProfile();
  const { enabled: xpVisible } = useFeatureFlag('xp_score_visible');
  const streak = profile?.current_streak ?? 0;
  const xp = profile?.total_points_earned ?? 0;
  const isActive = streak > 0;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Streak */}
      <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
        isActive
          ? 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400'
          : 'border-border bg-muted/40 text-muted-foreground'
      }`}>
        <Flame className={`h-4 w-4 ${isActive ? 'animate-pulse text-orange-500' : 'text-muted-foreground'}`} />
        {isActive ? (
          <span>{streak} day{streak !== 1 ? 's' : ''}</span>
        ) : (
          <span>Start your streak today</span>
        )}
      </div>

      {/* XP */}
      {xpVisible && (
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground">
          <Star className="h-4 w-4 text-amber-500" />
          <span>{xp.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}
