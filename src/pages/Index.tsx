import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, useCompanyFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveOnboardingRoute } from '@/lib/onboardingRoute';
import LandingPage from '@/components/landing/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();
  const { globalPath, isLoading: presetLoading } = useFirstLoginFlow();
  const { companyOverrideEnabled, companyOverridePath, isLoading: companyPresetLoading } = useCompanyFirstLoginFlow(profile?.company_id);

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
  if (profile.onboarding_completed || isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  if (hasAssessments) {
    return <Navigate to="/profile" replace />;
  }

  const { path, reason } = resolveOnboardingRoute({
    companyOverrideEnabled,
    companyOverridePath,
    globalPath,
  });
  console.debug(`[onboarding-route] user=${user.id} path=${path} reason=${reason} source=index`);
  return <Navigate to={path} replace />;
};

export default Index;
