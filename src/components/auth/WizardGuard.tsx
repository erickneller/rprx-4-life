import { Navigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, useCompanyFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveFinalOnboardingPath, resolveOnboardingRoute } from '@/lib/onboardingRoute';
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
  const isCompanyUser = !!profile.company_id;

  const { path: onboardingPath, reason } = resolveFinalOnboardingPath({
    onboardingCompleted: profile.onboarding_completed,
    isProfileComplete,
    hasAssessments,
    companyOverrideEnabled,
    companyOverridePath,
    globalPath,
  });

  // Low-level preset path (for the allowed-route gate so users mid-onboarding
  // aren't bounced off the wizard/assessment page they're working through).
  const { path: presetPath } = resolveOnboardingRoute({
    companyOverrideEnabled,
    companyOverridePath,
    globalPath,
  });

  const logPayload = {
    source: 'guard' as const,
    user: profile.id,
    isCompanyUser,
    companyOverrideEnabled,
    companyOverridePath,
    globalRaw,
    globalNormalized: globalPath,
    reason,
    finalRedirectPath: onboardingPath,
  };

  const isWizardRoute = location.pathname === '/wizard' || location.pathname.startsWith('/wizard/');

  if (isWizardRoute && onboardingPath !== '/wizard') {
    console.debug('[onboarding-route]', logPayload);
    return <Navigate to={onboardingPath} replace />;
  }

  const isAllowed =
    ALLOWED_PATHS.some(p => location.pathname.startsWith(p)) ||
    location.pathname.startsWith(onboardingPath) ||
    location.pathname.startsWith(presetPath);
  if (isAllowed) return <>{children}</>;

  // Skip the forced redirect when the unified adapter already says the user
  // belongs on /dashboard (profile complete, or global preset is dashboard-only).
  const suppressForcedRedirect = reason === 'profile_complete' || reason === 'force_dashboard_global';

  if (!suppressForcedRedirect && shouldGuardRedirect(effectivePreset) && !profile.onboarding_completed && !isProfileComplete) {
    console.debug('[onboarding-route]', logPayload);
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
