import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { useRPRxScore } from '@/hooks/useRPRxScore';

const GRADE_THRESHOLDS = [
  { grade: 'at_risk', label: 'At Risk', icon: '🔴', min: 0, max: 39 },
  { grade: 'awakening', label: 'Awakening', icon: '🟠', min: 40, max: 54 },
  { grade: 'progressing', label: 'Progressing', icon: '🟡', min: 55, max: 69 },
  { grade: 'recovering', label: 'Recovering', icon: '🟢', min: 70, max: 84 },
  { grade: 'thriving', label: 'Thriving', icon: '💎', min: 85, max: 100 },
];

export function TierProgressBar() {
  const { score } = useRPRxScore();

  const { progressPercent, label, currentGrade, nextGrade } = useMemo(() => {
    if (!score) return { progressPercent: 0, label: '', currentGrade: GRADE_THRESHOLDS[0], nextGrade: GRADE_THRESHOLDS[1] };

    const current = GRADE_THRESHOLDS.find(g => score.total >= g.min && score.total <= g.max) ?? GRADE_THRESHOLDS[0];
    const currentIdx = GRADE_THRESHOLDS.indexOf(current);
    const next = currentIdx < GRADE_THRESHOLDS.length - 1 ? GRADE_THRESHOLDS[currentIdx + 1] : null;

    if (!next) {
      return { progressPercent: 100, label: 'Max Grade!', currentGrade: current, nextGrade: null };
    }

    const rangeSize = current.max - current.min + 1;
    const inRange = score.total - current.min;
    const pct = Math.round((inRange / rangeSize) * 100);

    return {
      progressPercent: Math.min(pct, 100),
      label: `${score.total} / ${next.min} to ${next.label}`,
      currentGrade: current,
      nextGrade: next,
    };
  }, [score]);

  if (!score) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {currentGrade.icon} {currentGrade.label}
        </span>
        <span className="font-medium text-foreground">
          {nextGrade ? `${nextGrade.icon} ${nextGrade.label}` : '🎉 Max Grade!'}
        </span>
      </div>
      <Progress value={progressPercent} className="h-2.5" />
      <p className="text-xs text-center text-muted-foreground">{label}</p>
    </div>
  );
}
