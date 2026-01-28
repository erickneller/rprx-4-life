import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';
import { getCashFlowLabel, getCashFlowDescription } from '@/lib/cashFlowCalculator';

interface CashFlowIndicatorProps {
  status: CashFlowStatus;
}

export function CashFlowIndicator({ status }: CashFlowIndicatorProps) {
  const iconMap = {
    surplus: TrendingUp,
    tight: Minus,
    deficit: TrendingDown,
  };

  const colorMap = {
    surplus: 'text-green-600 bg-green-50 border-green-200',
    tight: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    deficit: 'text-red-600 bg-red-50 border-red-200',
  };

  const Icon = iconMap[status];

  return (
    <Card className={cn('border', colorMap[status])}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <CardTitle className="text-lg">Cash Flow Snapshot</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{getCashFlowLabel(status)}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {getCashFlowDescription(status)}
        </p>
      </CardContent>
    </Card>
  );
}
