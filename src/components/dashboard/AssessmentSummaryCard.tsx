import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { UserAssessment } from '@/lib/assessmentTypes';
import type { HorsemanType } from '@/lib/scoringEngine';
import { getHorsemanLabel } from '@/lib/scoringEngine';
import { getCashFlowLabel } from '@/lib/cashFlowCalculator';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

interface AssessmentSummaryCardProps {
  assessment: UserAssessment;
  isLatest?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AssessmentSummaryCard({
  assessment,
  isLatest = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onDelete,
}: AssessmentSummaryCardProps) {
  const navigate = useNavigate();

  const completedDate = assessment.completed_at
    ? format(new Date(assessment.completed_at), 'MMM d, yyyy')
    : 'In Progress';

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.(assessment.id);
    } else {
      navigate(`/results/${assessment.id}`);
    }
  };

  return (
    <Card
      className={`${isLatest ? 'border-primary/30' : ''} ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-primary' : ''} relative`}
      onClick={selectionMode ? handleCardClick : undefined}
    >
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(assessment.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${selectionMode ? 'ml-7' : ''}`}>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{completedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            {isLatest && (
              <Badge variant="secondary" className="text-xs">
                Latest
              </Badge>
            )}
            {!selectionMode && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(assessment.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
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

        {!selectionMode && (
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => navigate(`/results/${assessment.id}`)}
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
