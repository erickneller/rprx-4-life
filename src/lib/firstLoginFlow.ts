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

export type OnboardingRouteReason = 'company_override' | 'global_default' | 'fallback';

export interface OnboardingProfileState {
  isProfileComplete: boolean;
  hasAssessments: boolean;
  onboardingCompleted?: boolean | null;
}

export interface OnboardingRouteConfig {
  preset?: FirstLoginFlowPreset | string | null;
  enabled?: boolean | null;
}

export interface ResolvedOnboardingRoute {
  route: string | null;
  preset: FirstLoginFlowPreset;
  reason: OnboardingRouteReason;
}

/** Back-compat config shape for callers that only need the effective preset. */
export interface OnboardingConfig {
  globalPreset?: FirstLoginFlowPreset | string | null;
  companyPreset?: FirstLoginFlowPreset | string | null;
  companyEnabled?: boolean | null;
}

function isFirstLoginPreset(v: unknown): v is FirstLoginFlowPreset {
  return typeof v === 'string' && FIRST_LOGIN_FLOW_OPTIONS.some(o => o.value === v);
}

export function resolveOnboardingPreset(cfg: OnboardingConfig): FirstLoginFlowPreset {
  return resolveOnboardingRoute(
    { isProfileComplete: false, hasAssessments: false, onboardingCompleted: false },
    { preset: cfg.companyPreset, enabled: cfg.companyEnabled ?? cfg.companyPreset != null },
    { preset: cfg.globalPreset },
  ).preset;
}

export function resolveOnboardingRoute(
  profile: OnboardingProfileState,
  companyConfig: OnboardingRouteConfig | null | undefined,
  globalConfig: OnboardingRouteConfig | null | undefined,
): ResolvedOnboardingRoute {
  const companyOverrideEnabled = companyConfig?.enabled !== false;
  if (companyOverrideEnabled && isFirstLoginPreset(companyConfig?.preset)) {
    return {
      route: profile.onboardingCompleted ? null : getFirstDestination({ preset: companyConfig.preset, ...profile }),
      preset: companyConfig.preset,
      reason: 'company_override',
    };
  }

  if (isFirstLoginPreset(globalConfig?.preset)) {
    return {
      route: profile.onboardingCompleted ? null : getFirstDestination({ preset: globalConfig.preset, ...profile }),
      preset: globalConfig.preset,
      reason: 'global_default',
    };
  }

  return {
    route: profile.onboardingCompleted ? null : '/wizard',
    preset: DEFAULT_FIRST_LOGIN_FLOW,
    reason: 'fallback',
  };
}
