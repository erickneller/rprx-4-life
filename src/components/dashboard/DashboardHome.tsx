import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { AssessmentHistory } from './AssessmentHistory';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Loader2, MessageSquare, FileText } from 'lucide-react';
import rprxLogo from '@/assets/rprx-logo.png';

export function DashboardHome() {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  const isFirstTime = assessments.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={rprxLogo} alt="RPRx 4 Life" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">RPRx 4 Life</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/plans')}>
              <FileText className="h-4 w-4 mr-2" />
              My Plans
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/strategy-assistant')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Strategy Assistant
            </Button>
            <ProfileAvatar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
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
      </main>
    </div>
  );
}
