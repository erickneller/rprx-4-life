import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { UserAssessment } from '@/lib/assessmentTypes';
import type { HorsemanType } from '@/lib/scoringEngine';
import { getHorsemanLabel } from '@/lib/scoringEngine';
import { getCashFlowLabel } from '@/lib/cashFlowCalculator';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

interface AssessmentSummaryCardProps {
  assessment: UserAssessment;
  isLatest?: boolean;
}

export function AssessmentSummaryCard({
  assessment,
  isLatest = false,
}: AssessmentSummaryCardProps) {
  const navigate = useNavigate();

  const completedDate = assessment.completed_at
    ? format(new Date(assessment.completed_at), 'MMM d, yyyy')
    : 'In Progress';

  return (
    <Card className={isLatest ? 'border-primary/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{completedDate}</span>
          </div>
          {isLatest && (
            <Badge variant="secondary" className="text-xs">
              Latest
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessment.primary_horseman && (
          <div>
            <p className="text-sm text-muted-foreground">Primary Pressure</p>
            <p className="font-semibold text-foreground">
              {getHorsemanLabel(assessment.primary_horseman as HorsemanType)}
            </p>
          </div>
        )}

        {assessment.cash_flow_status && (
          <div>
            <p className="text-sm text-muted-foreground">Cash Flow</p>
            <p className="font-medium text-foreground">
              {getCashFlowLabel(assessment.cash_flow_status as CashFlowStatus)}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => navigate(`/results/${assessment.id}`)}
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
