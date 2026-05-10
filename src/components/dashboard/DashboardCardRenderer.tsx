import { useMemo } from 'react';
import type { DashboardCardConfig } from '@/hooks/useDashboardConfig';
import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

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
import { AdvisorCTACard } from './AdvisorCTACard';
import { VirtualAdvisorCard } from './VirtualAdvisorCard';

interface DashboardCardRendererProps {
  cards: DashboardCardConfig[];
  cardProps: {
    motivation?: { motivation: string | null; images: string[]; onEdit: () => void; onDelete: () => void };
    currentFocus?: { focusName: string; description: string; progressPercent: number; onContinue: () => void } | null;
    cashFlow?: { surplus: number | null; status: string | null };
  };
  onReorder?: (orderedIds: string[]) => void;
}

function toKebab(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export function DashboardCardRenderer({ cards, cardProps, onReorder }: DashboardCardRendererProps) {
  const visibleCards = cards.filter(c => c.is_visible);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const cardNodes = useMemo(() => {
    return visibleCards
      .map(card => {
        const node = renderCard(card, cardProps);
        if (!node) return null;
        return { card, node };
      })
      .filter(Boolean) as { card: DashboardCardConfig; node: ReactNode }[];
  }, [visibleCards, cardProps]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = cardNodes.findIndex(c => c.card.id === active.id);
    const newIndex = cardNodes.findIndex(c => c.card.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...cardNodes];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map(c => c.card.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cardNodes.map(c => c.card.id)} strategy={verticalListSortingStrategy}>
        {cardNodes.map(({ card, node }) => (
          <SortableCard key={card.id} id={card.id}>
            <div id={toKebab(card.component_key)}>{node}</div>
          </SortableCard>
        ))}
      </SortableContext>
    </DndContext>
  );
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
    case 'AdvisorCTACard':
      return <AdvisorCTACard />;
    default:
      return null;
  }
}
