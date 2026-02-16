import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';
import { getTier } from '@/lib/gamification';

const TIER_RING_COLORS: Record<string, string> = {
  red: 'stroke-red-500',
  orange: 'stroke-orange-500',
  yellow: 'stroke-yellow-500',
  green: 'stroke-green-500',
  purple: 'stroke-purple-500',
};

interface GamificationScoreCardProps {
  compact?: boolean;
}

export function GamificationScoreCard({ compact = false }: GamificationScoreCardProps) {
  const { rprxScore, tier } = useGamification();

  const radius = compact ? 32 : 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(rprxScore / 1000, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const svgSize = compact ? 80 : 128;
  const strokeWidth = compact ? 6 : 10;
  const center = svgSize / 2;
  const ringColor = TIER_RING_COLORS[tier.color] ?? 'stroke-primary';

  const nextTierInfo = useMemo(() => {
    if (!tier.nextTier) return null;
    const nextTier = getTier(tier.maxScore + 1);
    const pointsNeeded = nextTier.minScore - rprxScore;
    return { name: nextTier.name, icon: nextTier.icon, pointsNeeded };
  }, [tier, rprxScore]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            <circle
              cx={center} cy={center} r={radius} fill="none"
              className={`${ringColor} transition-all duration-700`}
              strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground">{rprxScore}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{tier.icon} {tier.name}</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
        <div className="relative flex-shrink-0">
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            <circle
              cx={center} cy={center} r={radius} fill="none"
              className={`${ringColor} transition-all duration-700`}
              strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{rprxScore}</span>
            <span className="text-xs text-muted-foreground">/1000</span>
          </div>
        </div>

        <div className="text-center sm:text-left space-y-2">
          <h3 className="text-lg font-semibold text-foreground">RPRx Score</h3>
          <p className="text-2xl font-bold">{tier.icon} {tier.name}</p>
          {nextTierInfo ? (
            <p className="text-sm text-muted-foreground">
              Next tier: {nextTierInfo.icon} {nextTierInfo.name} — {nextTierInfo.pointsNeeded} more points
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">🎉 You've reached the highest tier!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
