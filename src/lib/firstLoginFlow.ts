export type FirstLoginFlowPreset =
  | 'profile_then_assessment'
  | 'assessment_then_profile'
  | 'assessment_only'
  | 'profile_only'
  | 'dashboard_silent'
  | 'dashboard_nudge';

export const FIRST_LOGIN_FLOW_OPTIONS: { value: FirstLoginFlowPreset; label: string; description: string }[] = [
  { value: 'profile_then_assessment', label: 'Profile → Assessment → Dashboard', description: 'Default. New users finish profile, then take their first assessment.' },
  { value: 'assessment_then_profile', label: 'Assessment → Profile → Dashboard', description: 'New users start with the assessment, then complete their profile.' },
  { value: 'assessment_only', label: 'Assessment only → Dashboard', description: 'Skip the profile wizard. Profile becomes optional (banner-only nudge).' },
  { value: 'profile_only', label: 'Profile only → Dashboard', description: 'Profile is required, assessment is fully optional.' },
  { value: 'dashboard_silent', label: 'Dashboard only — silent', description: 'No forced onboarding, no banners, no nudges. Users explore freely.' },
  { value: 'dashboard_nudge', label: 'Dashboard only — with nudges', description: 'Free explore, but show banners until profile and assessment are done.' },
];

export const DEFAULT_FIRST_LOGIN_FLOW: FirstLoginFlowPreset = 'profile_then_assessment';

interface DestinationInput {
  preset: FirstLoginFlowPreset;
  isProfileComplete: boolean;
  hasAssessments: boolean;
}

/**
 * First destination after auth/phone capture for a new user.
 * Returns null when no forced redirect is needed (send to dashboard).
 */
export function getFirstDestination({ preset, isProfileComplete, hasAssessments }: DestinationInput): string | null {
  switch (preset) {
    case 'profile_then_assessment':
      if (!isProfileComplete) return '/wizard';
      if (!hasAssessments) return '/assessment';
      return null;
    case 'assessment_then_profile':
      if (!hasAssessments) return '/assessment';
      if (!isProfileComplete) return '/wizard';
      return null;
    case 'assessment_only':
      if (!hasAssessments) return '/assessment';
      return null;
    case 'profile_only':
      if (!isProfileComplete) return '/wizard';
      return null;
    case 'dashboard_silent':
    case 'dashboard_nudge':
      return null;
    default:
      return null;
  }
}

/** Whether the WizardGuard should hard-redirect missing-data users. */
export function shouldGuardRedirect(preset: FirstLoginFlowPreset): boolean {
  return preset !== 'dashboard_silent' && preset !== 'dashboard_nudge';
}

/** Whether to show the "complete your profile" banner. */
export function shouldShowProfileNudge(preset: FirstLoginFlowPreset): boolean {
  return preset !== 'dashboard_silent' && preset !== 'assessment_only';
}

/** Whether to show the "take your assessment" banner. */
export function shouldShowAssessmentNudge(preset: FirstLoginFlowPreset): boolean {
  return preset !== 'dashboard_silent' && preset !== 'profile_only';
}

/** Destination after the Profile Wizard finishes. */
export function getPostWizardDestination(preset: FirstLoginFlowPreset, hasAssessments: boolean): string {
  if ((preset === 'profile_then_assessment' || preset === 'assessment_then_profile') && !hasAssessments) {
    return '/assessment';
  }
  return '/dashboard';
}
