import { Loader2 } from 'lucide-react';
import { AssessmentSummaryCard } from './AssessmentSummaryCard';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';

export function AssessmentHistory() {
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assessments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Assessment History</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment, index) => (
          <AssessmentSummaryCard
            key={assessment.id}
            assessment={assessment}
            isLatest={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
