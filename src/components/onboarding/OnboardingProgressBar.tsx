const PHASES = [
  { name: 'Clarity', days: [1, 2, 3], color: 'bg-blue-400' },
  { name: 'Awareness', days: [4, 5, 6, 7, 8, 9, 10], color: 'bg-emerald-400' },
  { name: 'Second Win', days: [11, 12, 13, 14, 15, 16, 17, 18], color: 'bg-amber-400' },
  { name: 'Identity', days: [19, 20, 21, 22, 23, 24, 25], color: 'bg-purple-400' },
  { name: 'Vision', days: [26, 27, 28, 29, 30], color: 'bg-rose-400' },
];

interface OnboardingProgressBarProps {
  completedDays: number[];
  currentDay: number;
}

export function OnboardingProgressBar({ completedDays, currentDay }: OnboardingProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const isCompleted = completedDays.includes(day);
          const isCurrent = day === currentDay;
          const phase = PHASES.find(p => p.days.includes(day));
          const colorClass = phase?.color || 'bg-muted';

          return (
            <div
              key={day}
              className={`flex-1 transition-all ${
                isCompleted
                  ? colorClass
                  : isCurrent
                    ? `${colorClass} animate-pulse opacity-70`
                    : 'bg-muted'
              }`}
              title={`Day ${day}${isCompleted ? ' ✓' : isCurrent ? ' (today)' : ''}`}
            />
          );
        })}
      </div>
      <div className="flex text-[10px] text-muted-foreground">
        {PHASES.map((p) => (
          <div key={p.name} style={{ flex: p.days.length }} className="text-center truncate">
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
