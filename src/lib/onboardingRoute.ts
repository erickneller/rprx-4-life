export type OnboardingRouteReason = 'company_override' | 'global_default' | 'fallback_wizard';

interface ResolveOnboardingRouteOptions {
  companyOverrideEnabled?: boolean;
  companyOverridePath?: string | null;
  globalPath?: string | null;
}

interface ResolvedOnboardingRoute {
  path: string;
  reason: OnboardingRouteReason;
}

function sanitizePath(path?: string | null): string | null {
  const trimmed = typeof path === 'string' ? path.trim() : '';
  return trimmed.startsWith('/') ? trimmed : null;
}

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