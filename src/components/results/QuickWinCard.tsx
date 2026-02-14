import { Zap } from 'lucide-react';
import type { HorsemanType } from '@/lib/scoringEngine';

const QUICK_WIN_MESSAGES: Record<HorsemanType, string> = {
  taxes:
    'Adjusting your W-4 withholding could put an extra $200-500/month back in your paycheck — starting with your next pay period.',
  interest:
    'Restructuring your debt payments using the avalanche method could save you thousands in interest and accelerate your payoff date.',
  insurance:
    'A quick insurance coverage review could reveal overlapping policies or gaps that are costing you money every month.',
  education:
    'Strategic financial aid timing and tax credit optimization could reduce education costs by 30-50%.',
};

interface QuickWinCardProps {
  primaryHorseman: HorsemanType;
}

export function QuickWinCard({ primaryHorseman }: QuickWinCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-[2px] rounded-lg">
      <div className="bg-card rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">⚡ Your Quick Win</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {QUICK_WIN_MESSAGES[primaryHorseman]}
        </p>
        <p className="text-sm text-primary/80 italic">
          Complete the Deep Dive below to get your personalized action plan →
        </p>
      </div>
    </div>
  );
}
