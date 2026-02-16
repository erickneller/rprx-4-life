import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { getTier } from '@/lib/gamification';

export function TierProgressBar() {
  const { rprxScore, tier } = useGamification();

  const { progressPercent, label, nextTier } = useMemo(() => {
    const rangeSize = tier.maxScore - tier.minScore + 1;
    const inTier = rprxScore - tier.minScore;
    const pct = Math.round((inTier / rangeSize) * 100);

    if (!tier.nextTier) {
      return { progressPercent: 100, label: 'Max Tier!', nextTier: null };
    }

    const next = getTier(tier.maxScore + 1);
    return {
      progressPercent: Math.min(pct, 100),
      label: `${rprxScore} / ${tier.maxScore + 1} to ${next.name}`,
      nextTier: next,
    };
  }, [rprxScore, tier]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {tier.icon} {tier.name}
        </span>
        <span className="font-medium text-foreground">
          {nextTier ? `${nextTier.icon} ${nextTier.name}` : '🎉 Max Tier!'}
        </span>
      </div>
      <Progress value={progressPercent} className="h-2.5" />
      <p className="text-xs text-center text-muted-foreground">{label}</p>
    </div>
  );
}
