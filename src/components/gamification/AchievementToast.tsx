import { toast } from 'sonner';
import type { AwardedBadge } from '@/lib/gamification';

export function showAchievementToast(badge: AwardedBadge) {
  toast.custom(
    () => (
      <div className="flex items-center gap-4 rounded-lg border border-accent/30 bg-card p-4 shadow-lg ring-1 ring-accent/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl shrink-0">
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">🏆 Achievement Unlocked!</p>
          <p className="text-sm font-medium text-foreground">{badge.name}</p>
          <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
          <p className="text-xs font-semibold text-accent mt-0.5">+{badge.points} RPRx Points</p>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}

export function showPointsEarnedToast(points: number, reason: string) {
  toast.custom(
    () => (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm shrink-0">
          ⭐
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">+{points} RPRx Points</p>
          <p className="text-xs text-muted-foreground">{reason}</p>
        </div>
      </div>
    ),
    { duration: 3000 }
  );
}
