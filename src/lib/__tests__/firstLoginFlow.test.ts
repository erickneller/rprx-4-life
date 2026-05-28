import { describe, it, expect } from 'vitest';
import {
  resolveOnboardingPreset,
  resolveOnboardingRoute,
  shouldGuardRedirect,
  getPostWizardDestination,
} from '../firstLoginFlow';

describe('resolveOnboardingPreset', () => {
  it('returns company preset when set', () => {
    expect(
      resolveOnboardingPreset({
        globalPreset: 'profile_then_assessment',
        companyPreset: 'dashboard_silent',
      }),
    ).toBe('dashboard_silent');
  });

  it('falls back to global when company is null/undefined', () => {
    expect(
      resolveOnboardingPreset({ globalPreset: 'profile_then_assessment', companyPreset: null }),
    ).toBe('profile_then_assessment');
    expect(
      resolveOnboardingPreset({ globalPreset: 'profile_then_assessment' }),
    ).toBe('profile_then_assessment');
  });

  it('ignores an invalid company preset value', () => {
    expect(
      resolveOnboardingPreset({
        globalPreset: 'profile_then_assessment',
        companyPreset: 'garbage_value',
      }),
    ).toBe('profile_then_assessment');
  });
});

describe('resolveOnboardingRoute', () => {
  it('new user + company override dashboard_silent → null (dashboard)', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: false, hasAssessments: false },
        { preset: 'dashboard_silent', enabled: true },
        { preset: 'profile_then_assessment' },
      ).route,
    ).toBeNull();
  });

  it('new user + no company override + global profile_then_assessment → /wizard', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: false, hasAssessments: false },
        { preset: null, enabled: false },
        { preset: 'profile_then_assessment' },
      ).route,
    ).toBe('/wizard');
  });

  it('profile complete + no assessments + profile_then_assessment → /assessment', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: true, hasAssessments: false },
        null,
        { preset: 'profile_then_assessment' },
      ).route,
    ).toBe('/assessment');
  });

  it('everything done → null', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: true, hasAssessments: true },
        null,
        { preset: 'profile_then_assessment' },
      ).route,
    ).toBeNull();
  });

  it('assessment_then_profile sends new user to /assessment first', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: false, hasAssessments: false },
        null,
        { preset: 'assessment_then_profile' },
      ).route,
    ).toBe('/assessment');
  });

  it('company override beats a different global', () => {
    expect(
      resolveOnboardingRoute(
        { isProfileComplete: false, hasAssessments: false },
        { preset: 'profile_only', enabled: true },
        { preset: 'dashboard_silent' },
      ).route,
    ).toBe('/wizard');
  });

  it('reports route source reasons by precedence', () => {
    expect(resolveOnboardingRoute({ isProfileComplete: false, hasAssessments: false }, { preset: 'profile_only', enabled: true }, { preset: 'dashboard_silent' }).reason).toBe('company_override');
    expect(resolveOnboardingRoute({ isProfileComplete: false, hasAssessments: false }, { preset: null, enabled: false }, { preset: 'profile_then_assessment' }).reason).toBe('global_default');
    expect(resolveOnboardingRoute({ isProfileComplete: false, hasAssessments: false }, { preset: null, enabled: false }, { preset: null }).reason).toBe('fallback');
  });
});

describe('shouldGuardRedirect via resolveOnboardingPreset', () => {
  it('is false for dashboard presets', () => {
    expect(
      shouldGuardRedirect(
        resolveOnboardingPreset({
          globalPreset: 'profile_then_assessment',
          companyPreset: 'dashboard_silent',
        }),
      ),
    ).toBe(false);
    expect(
      shouldGuardRedirect(
        resolveOnboardingPreset({
          globalPreset: 'profile_then_assessment',
          companyPreset: 'dashboard_nudge',
        }),
      ),
    ).toBe(false);
  });

  it('is true for forced-onboarding presets', () => {
    expect(
      shouldGuardRedirect(
        resolveOnboardingPreset({ globalPreset: 'profile_then_assessment' }),
      ),
    ).toBe(true);
  });
});

describe('getPostWizardDestination (unchanged behavior)', () => {
  it('routes to /assessment when assessment still needed', () => {
    expect(getPostWizardDestination('profile_then_assessment', false)).toBe('/assessment');
  });
  it('routes to /dashboard once assessments are done', () => {
    expect(getPostWizardDestination('profile_then_assessment', true)).toBe('/dashboard');
  });
});
