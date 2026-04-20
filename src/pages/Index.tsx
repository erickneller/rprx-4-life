import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import LandingPage from '@/components/landing/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();

  if (loading || (user && (profileLoading || !profile || assessmentsLoading))) {
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

  // Redirect to phone interstitial if phone is missing (Google OAuth users)
  if (!profile?.phone?.trim()) {
    return <Navigate to="/complete-phone" replace />;
  }

  const hasCompletedAssessment = (assessments || []).some(a => a.completed_at);

  // If user has even one completed assessment, never bounce to the wizard
  if (hasCompletedAssessment) {
    return <Navigate to="/dashboard" replace />;
  }

  // No assessments yet — route incomplete profiles to wizard
  if (!isProfileComplete) {
    return <Navigate to="/wizard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default Index;
