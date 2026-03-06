import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestones',
  strategy: 'Strategies',
  streak: 'Streaks',
  savings: 'Savings',
  engagement: 'Engagement',
};

const CATEGORY_ORDER = ['milestone', 'strategy', 'streak', 'savings', 'engagement'];

interface AllBadgesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllBadgesDialog({ open, onOpenChange }: AllBadgesDialogProps) {
  const { badges } = useGamification();

  const earnedIds = useMemo(
    () => new Set(badges.earned.map((b) => b.badge_id)),
    [badges.earned]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, {
      id: string; name: string; icon: string; description: string;
      points: number; earned: boolean; earnedAt?: string;
    }[]> = {};
    for (const badge of badges.available) {
      const cat = badge.category;
      if (!groups[cat]) groups[cat] = [];
      const earnedEntry = badges.earned.find((e) => e.badge_id === badge.id);
      groups[cat].push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        points: badge.points,
        earned: earnedIds.has(badge.id),
        earnedAt: earnedEntry?.earned_at,
      });
    }
    return groups;
  }, [badges.available, badges.earned, earnedIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Achievements</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {CATEGORY_ORDER.map((category) => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;
            const earnedCount = items.filter((i) => i.earned).length;

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {CATEGORY_LABELS[category] ?? category}{' '}
                  <span className="text-muted-foreground font-normal">({earnedCount}/{items.length})</span>
                </h3>
                <div className="space-y-2">
                  {items.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                        badge.earned ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'
                      }`}
                    >
                      <span className={`text-2xl shrink-0 ${!badge.earned ? 'grayscale' : ''}`}>
                        {badge.earned ? badge.icon : '🔒'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {badge.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                        {badge.earned && badge.earnedAt && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()} · +{badge.points} XP
                          </p>
                        )}
                        {!badge.earned && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <Lock className="h-3 w-3" /> Locked
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
