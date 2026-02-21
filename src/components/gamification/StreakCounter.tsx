import { useGamification } from '@/hooks/useGamification';

interface StreakCounterProps {
  compact?: boolean;
}

export function StreakCounter({ compact = false }: StreakCounterProps) {
  const { streak } = useGamification();

  const flameEmoji = streak.current >= 90
    ? '🔥🔥🔥'
    : streak.current >= 30
    ? '🔥🔥'
    : '🔥';

  const isActive = streak.current > 0;
  const shouldPulse = streak.current >= 7;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${!isActive ? 'opacity-50' : ''}`}>
        <span className={`text-sm ${shouldPulse ? 'animate-pulse' : ''}`}>{flameEmoji}</span>
        <span className="text-xs font-medium text-foreground">
          {isActive ? `${streak.current} days` : '0 days'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isActive ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-muted/30'}`}>
      <span className={`text-lg ${shouldPulse ? 'animate-pulse' : ''} ${!isActive ? 'grayscale' : ''}`}>
        {flameEmoji}
      </span>
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
          {isActive ? `${streak.current} day${streak.current !== 1 ? 's' : ''}` : 'Start your streak!'}
        </span>
        {isActive && (
          <span className="text-[10px] text-muted-foreground">
            Best: {streak.longest} day{streak.longest !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
