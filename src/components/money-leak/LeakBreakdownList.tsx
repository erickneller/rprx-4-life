import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMoneyLeak } from '@/hooks/useMoneyLeak';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LeakItem } from '@/lib/moneyLeakEstimator';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  not_started: { label: 'Not Started', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
};

const HORSEMAN_COLORS: Record<string, string> = {
  interest: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  taxes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  insurance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  education: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

function LeakRow({ item }: { item: LeakItem }) {
  const navigate = useNavigate();
  const statusInfo = STATUS_STYLES[item.status] || STATUS_STYLES.not_started;

  return (
    <button
      onClick={() => navigate('/plans')}
      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3"
    >
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">{item.planTitle}</p>
        <div className="flex flex-wrap gap-1">
          {item.horsemen.filter(h => h !== 'unknown').map(h => (
            <span key={h} className={`text-xs px-1.5 py-0.5 rounded ${HORSEMAN_COLORS[h] || ''}`}>
              {h.charAt(0).toUpperCase() + h.slice(1)}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm font-medium">
          {fmt.format(item.estimatedImpactLow)} – {fmt.format(item.estimatedImpactHigh)}
        </p>
        <div className="flex items-center gap-2 justify-end">
          <Badge variant={statusInfo.variant} className="text-xs">
            {statusInfo.label}
          </Badge>
          {item.stepsTotal > 0 && item.status !== 'not_started' && (
            <span className="text-xs text-muted-foreground">
              {item.stepsCompleted}/{item.stepsTotal}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function LeakBreakdownList() {
  const { result } = useMoneyLeak();
  const [showAll, setShowAll] = useState(false);

  if (!result || result.topLeaks.length === 0) return null;

  const items = showAll ? result.topLeaks : result.topLeaks.slice(0, 5);
  const hasMore = result.topLeaks.length > 5;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Plan Impact Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map(item => (
          <LeakRow key={item.planId} item={item} />
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {showAll ? 'Show less' : `Show all (${result.topLeaks.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
