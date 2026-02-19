import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lightbulb } from 'lucide-react';
import { useRPRxScore } from '@/hooks/useRPRxScore';

const GRADE_RING_COLORS: Record<string, string> = {
  at_risk: 'stroke-red-500',
  awakening: 'stroke-orange-500',
  progressing: 'stroke-yellow-500',
  recovering: 'stroke-green-500',
  thriving: 'stroke-purple-500',
};

const PILLAR_CONFIG = [
  { key: 'river' as const, label: 'River', icon: '🌊', max: 25, barClass: 'bg-blue-500', mutedClass: 'bg-blue-500/20' },
  { key: 'lake' as const, label: 'Lake', icon: '🏞️', max: 25, barClass: 'bg-teal-500', mutedClass: 'bg-teal-500/20' },
  { key: 'rainbow' as const, label: 'Rainbow', icon: '🌈', max: 20, barClass: 'bg-purple-500', mutedClass: 'bg-purple-500/20' },
  { key: 'tax' as const, label: 'Tax', icon: '💰', max: 15, barClass: 'bg-green-500', mutedClass: 'bg-green-500/20' },
  { key: 'stress' as const, label: 'Stress', icon: '🧠', max: 15, barClass: 'bg-amber-500', mutedClass: 'bg-amber-500/20' },
];

interface GamificationScoreCardProps {
  compact?: boolean;
}

export function GamificationScoreCard({ compact = false }: GamificationScoreCardProps) {
  const { score } = useRPRxScore();
  const [displayScore, setDisplayScore] = useState(0);

  // Count-up animation
  useEffect(() => {
    if (!score) return;
    const target = score.total;
    const duration = 700;
    const start = displayScore;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(start + (target - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score?.total]);

  if (!score) return null;

  const radius = compact ? 32 : 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score.total / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const svgSize = compact ? 80 : 128;
  const strokeWidth = compact ? 6 : 10;
  const center = svgSize / 2;
  const ringColor = GRADE_RING_COLORS[score.grade] ?? 'stroke-primary';

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
            <span className="text-sm font-bold text-foreground">{displayScore}</span>
            <span className="text-[10px]">{score.gradeIcon}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{score.gradeIcon} {score.gradeLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Score ring + grade */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
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
              <span className="text-2xl font-bold text-foreground">{displayScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-lg font-semibold text-foreground">RPRx Score</h3>
            <p className="text-2xl font-bold">{score.gradeIcon} {score.gradeLabel}</p>
          </div>
        </div>

        {/* Pillar breakdown */}
        <div className="space-y-3">
          {PILLAR_CONFIG.map(({ key, label, icon, max, barClass, mutedClass }) => {
            const value = score[key];
            const pct = Math.round((value / max) * 100);
            // Reduce opacity for low scores
            const opacity = pct < 30 ? 'opacity-60' : '';
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{icon} {label}</span>
                  <span className="text-muted-foreground">{value}/{max}</span>
                </div>
                <div className={`h-2 rounded-full ${mutedClass}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barClass} ${opacity}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {score.insights.length > 0 && (
          <div className="space-y-2">
            {score.insights.slice(0, 2).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
