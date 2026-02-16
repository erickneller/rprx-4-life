import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

export function BadgeDisplay() {
  const { badges } = useGamification();

  const earnedIds = useMemo(
    () => new Set(badges.earned.map((b) => b.badge_id)),
    [badges.earned]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, { id: string; name: string; icon: string; description: string; points: number; earned: boolean; earnedAt?: string }[]> = {};
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

  const mostRecentBadgeId = badges.earned[0]?.badge_id;

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;
        const earnedCount = items.filter((i) => i.earned).length;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {CATEGORY_LABELS[category] ?? category} ({earnedCount}/{items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                            badge.earned
                              ? badge.id === mostRecentBadgeId
                                ? 'border-accent bg-accent/5 shadow-sm ring-2 ring-accent/20 animate-pulse'
                                : 'border-border bg-card'
                              : 'border-border/50 bg-muted/30 opacity-60'
                          }`}
                        >
                          <span className={`text-2xl ${!badge.earned ? 'grayscale' : ''}`}>
                            {badge.earned ? badge.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                          </span>
                          <span className={`text-xs font-medium leading-tight ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {badge.name}
                          </span>
                          {badge.earned && (
                            <span className="text-[10px] text-muted-foreground">
                              +{badge.points} pts
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-xs font-medium">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.earned ? `Earned ${new Date(badge.earnedAt!).toLocaleDateString()}` : `How to earn: ${badge.description}`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
