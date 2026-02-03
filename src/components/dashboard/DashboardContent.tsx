import { useNavigate } from 'react-router-dom';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { AssessmentHistory } from './AssessmentHistory';
import { Loader2 } from 'lucide-react';

export function DashboardContent() {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  const isFirstTime = assessments.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <StartAssessmentCTA isFirstTime={isFirstTime} />
          <AssessmentHistory />
        </>
      )}
    </div>
  );
}
