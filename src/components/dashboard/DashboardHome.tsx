import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { AssessmentHistory } from './AssessmentHistory';
import { Loader2, LogOut, MessageSquare } from 'lucide-react';
import rprxLogo from '@/assets/rprx-logo.png';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

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
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/strategy-assistant')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Strategy Assistant
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
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
