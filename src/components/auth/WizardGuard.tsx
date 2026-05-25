import { Navigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import {
  getFirstDestination,
  shouldGuardRedirect,
  shouldShowProfileNudge,
  shouldShowAssessmentNudge,
} from '@/lib/firstLoginFlow';

const ALLOWED_PATHS = [
  '/wizard',
  '/assessment',
  '/results',
  '/complete-phone',
  '/profile',
  '/auth',
  '/auth/callback',
  '/reset-password',
];

interface WizardGuardProps {
  children: React.ReactNode;
}

export function WizardGuard({ children }: WizardGuardProps) {
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading, isFetched: assessmentsFetched } = useAssessmentHistory();
  const { preset, isLoading: presetLoading } = useFirstLoginFlow();
  const location = useLocation();

  if (profileLoading || assessmentsLoading || !assessmentsFetched || presetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!profile) return <>{children}</>;

  const isAllowed = ALLOWED_PATHS.some(p => location.pathname.startsWith(p));
  if (isAllowed) return <>{children}</>;

  const hasAssessments = (assessments || []).some(a => a.completed_at);

  // Forced redirect only when the preset enforces it AND user explicitly hasn't completed onboarding
  if (shouldGuardRedirect(preset) && !profile.onboarding_completed) {
    const dest = getFirstDestination({ preset, isProfileComplete, hasAssessments });
    if (dest) return <Navigate to={dest} replace />;
  }

  // Banner nudges (non-blocking)
  const needsProfile = !isProfileComplete && !profile.onboarding_completed && shouldShowProfileNudge(preset);
  const needsAssessment = !hasAssessments && shouldShowAssessmentNudge(preset);

  if (needsProfile || needsAssessment) {
    return (
      <div className="flex flex-col min-h-screen">
        {needsProfile && (
          <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-sm">
            Complete your profile to unlock your RPRx Score{' '}
            <Link to="/wizard" className="underline font-semibold hover:opacity-80">
              Continue →
            </Link>
          </div>
        )}
        {needsAssessment && (
          <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
            Take your first assessment to see your Four Horsemen results{' '}
            <Link to="/assessment" className="underline font-semibold hover:opacity-80">
              Start →
            </Link>
          </div>
        )}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
