import { useMemo } from 'react';
import type { DashboardCardConfig } from '@/hooks/useDashboardConfig';
import type { ReactNode } from 'react';

// Lazy component registry — all components imported statically
import { MotivationCard } from '@/components/debt-eliminator/dashboard/MotivationCard';
import { MoneyLeakCard } from '@/components/money-leak/MoneyLeakCard';
import { LeakBreakdownList } from '@/components/money-leak/LeakBreakdownList';
import { GamificationScoreCard } from '@/components/gamification/GamificationScoreCard';
import { TierProgressBar } from '@/components/gamification/TierProgressBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { CurrentFocusCard } from './CurrentFocusCard';
import { CashFlowStatusCard } from '@/components/debt-eliminator/dashboard/CashFlowStatusCard';
import { MyStrategiesCard } from './MyStrategiesCard';
import { RecentBadges } from '@/components/gamification/RecentBadges';
import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
interface DashboardCardRendererProps {
  cards: DashboardCardConfig[];
  cardProps: {
    motivation?: { motivation: string | null; images: string[]; onEdit: () => void; onDelete: () => void };
    currentFocus?: { focusName: string; description: string; progressPercent: number; onContinue: () => void } | null;
    cashFlow?: { surplus: number | null; status: string | null };
  };
}

export function DashboardCardRenderer({ cards, cardProps }: DashboardCardRendererProps) {
  const visibleCards = cards.filter(c => c.is_visible);

  // Group cards by size for flex layout
  const rendered = useMemo(() => {
    const elements: ReactNode[] = [];
    let partialRow: { node: ReactNode; size: string; key: string }[] = [];

    const flushPartials = () => {
      if (partialRow.length > 0) {
        elements.push(
          <div key={`row-${partialRow[0].key}`} className="flex flex-wrap gap-4">
            {partialRow.map(p => (
              <div key={p.key} className={p.size === 'half' ? 'w-full md:w-[calc(50%-0.5rem)]' : 'w-full md:w-[calc(33.333%-0.667rem)]'}>
                {p.node}
              </div>
            ))}
          </div>
        );
        partialRow = [];
      }
    };

    for (const card of visibleCards) {
      const node = renderCard(card, cardProps);
      if (!node) continue;

      if (card.default_size === 'full') {
        flushPartials();
        elements.push(<div key={card.id}>{node}</div>);
      } else {
        partialRow.push({ node, size: card.default_size, key: card.id });
      }
    }
    flushPartials();

    return elements;
  }, [visibleCards, cardProps]);

  return <>{rendered}</>;
}

function renderCard(card: DashboardCardConfig, props: DashboardCardRendererProps['cardProps']): ReactNode | null {
  switch (card.component_key) {
    case 'MotivationCard':
      return props.motivation ? (
        <MotivationCard
          motivation={props.motivation.motivation}
          images={props.motivation.images}
          onEdit={props.motivation.onEdit}
          onDelete={props.motivation.onDelete}
        />
      ) : null;
    case 'MoneyLeakCard':
      return <MoneyLeakCard />;
    case 'LeakBreakdownList':
      return <LeakBreakdownList />;
    case 'GamificationScoreCard':
      return (
        <div className="space-y-3">
          <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
            <div className="space-y-3">
              <GamificationScoreCard />
              <TierProgressBar />
            </div>
            <div className="flex md:flex-col gap-3 items-start">
              <StreakCounter />
            </div>
          </div>
        </div>
      );
    case 'CurrentFocusCard':
      return props.currentFocus ? (
        <CurrentFocusCard
          focusName={props.currentFocus.focusName}
          description={props.currentFocus.description}
          progressPercent={props.currentFocus.progressPercent}
          onContinue={props.currentFocus.onContinue}
        />
      ) : null;
    case 'CashFlowStatusCard':
      return <CashFlowStatusCard surplus={props.cashFlow?.surplus ?? null} status={(props.cashFlow?.status as any) ?? null} />;
    case 'MyStrategiesCard':
      return <MyStrategiesCard />;
    case 'RecentBadges':
      return <RecentBadges />;
    case 'OnboardingCard':
      return <OnboardingCard />;
    default:
      return null;
  }
}
