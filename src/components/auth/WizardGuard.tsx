import { Navigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';

const ALLOWED_PATHS = ['/wizard', '/assessment', '/complete-phone', '/profile', '/auth', '/auth/callback', '/reset-password'];

interface WizardGuardProps {
  children: React.ReactNode;
}

export function WizardGuard({ children }: WizardGuardProps) {
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();
  const location = useLocation();

  if (profileLoading || assessmentsLoading) return <>{children}</>;
  if (!profile) return <>{children}</>;

  const isAllowed = ALLOWED_PATHS.some(p => location.pathname.startsWith(p));
  if (isAllowed) return <>{children}</>;

  // If onboarding not complete and no assessments, redirect to wizard
  if (!profile.onboarding_completed && !isProfileComplete) {
    const hasAssessments = (assessments || []).some(a => a.completed_at);
    if (!hasAssessments) {
      return <Navigate to="/wizard" replace />;
    }
  }

  // Show banner if profile incomplete
  if (!isProfileComplete && !profile.onboarding_completed) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-sm">
          Complete your profile to unlock your RPRx Score{' '}
          <Link to="/wizard" className="underline font-semibold hover:opacity-80">
            Continue →
          </Link>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
