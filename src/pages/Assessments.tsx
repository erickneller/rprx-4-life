import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AssessmentHistory } from '@/components/dashboard/AssessmentHistory';
import { StartAssessmentCTA } from '@/components/dashboard/StartAssessmentCTA';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { Loader2 } from 'lucide-react';

export default function Assessments() {
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  return (
    <AuthenticatedLayout title="My Assessments">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StartAssessmentCTA isFirstTime={assessments.length === 0} />
            <AssessmentHistory />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
