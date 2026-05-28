import { describe, expect, it } from 'vitest';
import { resolveOnboardingRoute } from '../onboardingRoute';

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