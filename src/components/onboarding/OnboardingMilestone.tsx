import { Card } from '@/components/ui/card';

interface OnboardingMilestoneProps {
  dayNumber: number;
  completedDays: number;
  totalPoints: number;
  streak: number;
}

const MILESTONE_DAYS = [3, 7, 14, 21, 30];

export function OnboardingMilestone({ dayNumber, completedDays, totalPoints, streak }: OnboardingMilestoneProps) {
  if (!MILESTONE_DAYS.includes(dayNumber)) return null;

  const isDay30 = dayNumber === 30;

  return (
    <Card className={`relative overflow-hidden text-center p-6 ${isDay30 ? 'p-8' : ''}`}>
      {/* Sparkle animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(isDay30 ? 12 : 6)].map((_, i) => (
          <span
            key={i}
            className="absolute animate-sparkle text-lg"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      <div className={`relative z-10 space-y-3 ${isDay30 ? 'space-y-4' : ''}`}>
        <p className={`font-bold ${isDay30 ? 'text-3xl' : 'text-xl'}`}>
          {isDay30 ? '🎉 Congratulations! 🎉' : '🌟 Milestone Reached!'}
        </p>

        <div className="flex justify-center gap-6 text-sm">
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{completedDays}</p>
            <p className="text-muted-foreground">Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPoints}</p>
            <p className="text-muted-foreground">Points</p>
          </div>
          {streak > 1 && (
            <div>
              <p className="text-2xl font-bold text-orange-500">🔥 {streak}</p>
              <p className="text-muted-foreground">Streak</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
