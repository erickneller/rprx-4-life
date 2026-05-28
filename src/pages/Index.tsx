import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, useCompanyFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveOnboardingRoute } from '@/lib/firstLoginFlow';
import LandingPage from '@/components/landing/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();
  const { preset, isLoading: presetLoading } = useFirstLoginFlow();
  const { companyPreset, isLoading: companyPresetLoading } = useCompanyFirstLoginFlow(profile?.company_id);

  if (loading || (user && (profileLoading || !profile || assessmentsLoading || presetLoading || companyPresetLoading))) {
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
  const routeDecision = resolveOnboardingRoute(
    { isProfileComplete, hasAssessments, onboardingCompleted: profile.onboarding_completed },
    { preset: companyPreset, enabled: companyPreset != null },
    { preset },
  );
  const destination = routeDecision.route ?? '/dashboard';
  console.debug('[onboarding-route]', {
    surface: 'Index',
    route: destination,
    reason: routeDecision.reason,
    preset: routeDecision.preset,
    companyId: profile.company_id,
  });
  return <Navigate to={destination} replace />;
};

export default Index;
