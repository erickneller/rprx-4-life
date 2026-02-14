import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { calculateRPRxScore, getRPRxTier } from '@/lib/rprxScore';

export function RPRxScoreCard() {
  const { profile, updateProfile } = useProfile();
  const score = calculateRPRxScore(profile);
  const tier = getRPRxTier(score);
  const lastPersistedScore = useRef<number | null>(null);

  // Persist score to profile when it changes
  useEffect(() => {
    if (
      profile &&
      score !== lastPersistedScore.current &&
      score !== profile.rprx_score
    ) {
      lastPersistedScore.current = score;
      updateProfile.mutate({ rprx_score: score });
    }
  }, [score, profile?.rprx_score]);

  // SVG circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 1000, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
        {/* Circular indicator */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 64 64)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">/1000</span>
          </div>
        </div>

        {/* Text content */}
        <div className="text-center sm:text-left space-y-2">
          <h3 className="text-lg font-semibold text-foreground">RPRx Score</h3>
          <p className="text-2xl font-bold">
            {tier.emoji} {tier.label}
          </p>
          <p className="text-sm text-muted-foreground">
            Complete your Deep Dive to earn +75 points
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
