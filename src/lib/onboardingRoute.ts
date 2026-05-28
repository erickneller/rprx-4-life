export type OnboardingRouteReason =
  | 'company_override'
  | 'global_default'
  | 'fallback_wizard';

export type FinalOnboardingReason =
  | 'profile_complete'
  | 'company_override'
  | 'force_dashboard_global'
  | 'has_assessments_profile'
  | 'global_default'
  | 'fallback_wizard';

interface ResolveOnboardingRouteOptions {
  companyOverrideEnabled?: boolean;
  companyOverridePath?: string | null;
  globalPath?: string | null;
}

interface ResolvedOnboardingRoute {
  path: string;
  reason: OnboardingRouteReason;
}

export interface ResolveFinalOnboardingOptions {
  onboardingCompleted?: boolean | null;
  isProfileComplete?: boolean | null;
  hasAssessments?: boolean | null;
  companyOverrideEnabled?: boolean;
  companyOverridePath?: string | null;
  globalPath?: string | null;
}

export interface ResolvedFinalOnboardingPath {
  path: string;
  reason: FinalOnboardingReason;
}

function sanitizePath(path?: string | null): string | null {
  const trimmed = typeof path === 'string' ? path.trim() : '';
  return trimmed.startsWith('/') ? trimmed : null;
}

/**
 * Low-level resolver — returns the path the active preset would route to,
 * without considering profile completion / assessment history. Used by
 * WizardGuard's "allowed path" check and unit tests.
 */
export function resolveOnboardingRoute(opts: ResolveOnboardingRouteOptions): ResolvedOnboardingRoute {
  const companyPath = sanitizePath(opts.companyOverridePath);
  if (opts.companyOverrideEnabled && companyPath) {
    return { path: companyPath, reason: 'company_override' };
  }

  const globalPath = sanitizePath(opts.globalPath);
  if (globalPath) {
    return { path: globalPath, reason: 'global_default' };
  }

  return { path: '/wizard', reason: 'fallback_wizard' };
}

/**
 * Unified onboarding route adapter — single source of truth used by
 * Index, WizardGuard, Auth, and Join. Priority order:
 *   1. profile/onboarding already complete         → /dashboard
 *   2. company override enabled + valid path       → company path
 *   3. global path normalizes to /dashboard        → /dashboard
 *   4. user already has assessment history         → /profile
 *   5. global path set                             → that path
 *   6. fallback                                    → /wizard
 */
export function resolveFinalOnboardingPath(opts: ResolveFinalOnboardingOptions): ResolvedFinalOnboardingPath {
  const companyPath = sanitizePath(opts.companyOverridePath);
  const globalPath = sanitizePath(opts.globalPath);

  if (opts.onboardingCompleted || opts.isProfileComplete) {
    return { path: '/dashboard', reason: 'profile_complete' };
  }

  if (opts.companyOverrideEnabled && companyPath) {
    return { path: companyPath, reason: 'company_override' };
  }

  if (!opts.companyOverrideEnabled && globalPath === '/dashboard') {
    return { path: '/dashboard', reason: 'force_dashboard_global' };
  }

  if (opts.hasAssessments) {
    return { path: '/profile', reason: 'has_assessments_profile' };
  }

  if (globalPath) {
    return { path: globalPath, reason: 'global_default' };
  }

  return { path: '/wizard', reason: 'fallback_wizard' };
}
