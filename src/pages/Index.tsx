import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { getFirstDestination } from '@/lib/firstLoginFlow';
import LandingPage from '@/components/landing/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();
  const { preset, isLoading: presetLoading } = useFirstLoginFlow();

  if (loading || (user && (profileLoading || !profile || assessmentsLoading || presetLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Phone capture is always required for OAuth users
  if (!profile?.phone?.trim()) {
    return <Navigate to="/complete-phone" replace />;
  }

  const hasAssessments = (assessments || []).some(a => a.completed_at);
  const dest = getFirstDestination({ preset, isProfileComplete, hasAssessments });
  return <Navigate to={dest ?? '/dashboard'} replace />;
};

export default Index;
