import { describe, expect, it } from 'vitest';
import { resolveFinalOnboardingPath, resolveOnboardingRoute } from '../onboardingRoute';

describe('resolveOnboardingRoute', () => {
  it('company override wins over global', () => {
    expect(resolveOnboardingRoute({
      companyOverrideEnabled: true,
      companyOverridePath: '/company-start',
      globalPath: '/intro',
    })).toEqual({ path: '/company-start', reason: 'company_override' });
  });

  it('global is used when company override is absent or disabled', () => {
    expect(resolveOnboardingRoute({ globalPath: '/intro' })).toEqual({ path: '/intro', reason: 'global_default' });
    expect(resolveOnboardingRoute({
      companyOverrideEnabled: false,
      companyOverridePath: '/company-start',
      globalPath: '/intro',
    })).toEqual({ path: '/intro', reason: 'global_default' });
  });

  it('falls back to /wizard when no valid config is present', () => {
    expect(resolveOnboardingRoute({})).toEqual({ path: '/wizard', reason: 'fallback_wizard' });
  });

  it('ignores invalid paths', () => {
    expect(resolveOnboardingRoute({
      companyOverrideEnabled: true,
      companyOverridePath: 'company-start',
      globalPath: 'intro',
    })).toEqual({ path: '/wizard', reason: 'fallback_wizard' });
  });
});

describe('resolveFinalOnboardingPath', () => {
  it('sends incomplete company users to /dashboard when there is no company override and the global path is dashboard', () => {
    expect(resolveFinalOnboardingPath({
      onboardingCompleted: false,
      isProfileComplete: false,
      hasAssessments: false,
      companyOverrideEnabled: false,
      companyOverridePath: null,
      globalPath: '/dashboard',
    })).toEqual({ path: '/dashboard', reason: 'force_dashboard_global' });
  });

  it('still sends incomplete users to /wizard when no dashboard-only config exists', () => {
    expect(resolveFinalOnboardingPath({
      onboardingCompleted: false,
      isProfileComplete: false,
      hasAssessments: false,
      companyOverrideEnabled: false,
      companyOverridePath: null,
      globalPath: null,
    })).toEqual({ path: '/wizard', reason: 'fallback_wizard' });
  });
});