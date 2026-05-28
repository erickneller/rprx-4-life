import { Navigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, useCompanyFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveOnboardingRoute } from '@/lib/onboardingRoute';
import {
  shouldGuardRedirect,
  shouldShowProfileNudge,
  shouldShowAssessmentNudge,
} from '@/lib/firstLoginFlow';

const ALLOWED_PATHS = [
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
  const { preset, globalPath, globalRaw, isLoading: presetLoading } = useFirstLoginFlow();
  const { companyPreset, companyOverrideEnabled, companyOverridePath, isLoading: companyPresetLoading } = useCompanyFirstLoginFlow(profile?.company_id);
  const location = useLocation();

  if (profileLoading || assessmentsLoading || !assessmentsFetched || presetLoading || companyPresetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!profile) return <>{children}</>;

  const hasAssessments = (assessments || []).some(a => a.completed_at);
  const effectivePreset = companyPreset ?? preset;
  const { path: onboardingPath, reason } = resolveOnboardingRoute({
    companyOverrideEnabled,
    companyOverridePath,
    globalPath,
  });
  const isAllowed = ALLOWED_PATHS.some(p => location.pathname.startsWith(p)) || location.pathname.startsWith(onboardingPath);
  if (isAllowed) return <>{children}</>;

  // Forced redirect only when the resolved preset enforces it AND user explicitly hasn't completed onboarding
  if (shouldGuardRedirect(effectivePreset) && !profile.onboarding_completed && !isProfileComplete) {
    console.debug(`[onboarding-route] user=${profile.id} path=${onboardingPath} reason=${reason} source=guard`);
    return <Navigate to={onboardingPath} replace />;
  }

  // Banner nudges (non-blocking)
  const needsProfile = !isProfileComplete && !profile.onboarding_completed && shouldShowProfileNudge(effectivePreset);
  const needsAssessment = !hasAssessments && shouldShowAssessmentNudge(effectivePreset);

  if (needsProfile || needsAssessment) {
    return (
      <div className="flex flex-col min-h-screen">
        {needsProfile && (
          <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-sm">
            Complete your profile to unlock your RPRx Score{' '}
            <Link to={onboardingPath} className="underline font-semibold hover:opacity-80">
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
