import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WizardGuard } from '../WizardGuard';

// ─── Hook mocks ───────────────────────────────────────────────────────────
const profileState = {
  profile: null as any,
  isLoading: false,
  isProfileComplete: false,
};
const assessmentsState = {
  data: [] as any[],
  isLoading: false,
  isFetched: true,
};
const presetState = {
  preset: 'profile_then_assessment' as string,
  globalPath: null as string | null,
  isLoading: false,
};
const companyPresetState = {
  companyPreset: null as string | null,
  companyOverrideEnabled: false,
  companyOverridePath: null as string | null,
  isLoading: false,
};

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => profileState,
}));
vi.mock('@/hooks/useAssessmentHistory', () => ({
  useAssessmentHistory: () => assessmentsState,
}));
vi.mock('@/hooks/useFirstLoginFlow', () => ({
  useFirstLoginFlow: () => presetState,
  useCompanyFirstLoginFlow: () => companyPresetState,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <WizardGuard>
              <div>DASHBOARD</div>
            </WizardGuard>
          }
        />
        <Route path="/wizard" element={<div>WIZARD PAGE</div>} />
        <Route path="/intro" element={<div>INTRO PAGE</div>} />
        <Route path="/company-start" element={<div>COMPANY START PAGE</div>} />
        <Route path="/assessment" element={<div>ASSESSMENT PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  profileState.profile = null;
  profileState.isLoading = false;
  profileState.isProfileComplete = false;
  assessmentsState.data = [];
  assessmentsState.isFetched = true;
  assessmentsState.isLoading = false;
  presetState.preset = 'profile_then_assessment';
  presetState.globalPath = null;
  presetState.isLoading = false;
  companyPresetState.companyPreset = null;
  companyPresetState.companyOverrideEnabled = false;
  companyPresetState.companyOverridePath = null;
  companyPresetState.isLoading = false;
});

describe('WizardGuard', () => {
  it('redirects incomplete users to /wizard under the default global preset', () => {
    profileState.profile = { onboarding_completed: false, company_id: null };
    profileState.isProfileComplete = false;

    renderAt('/dashboard');
    expect(screen.getByText('WIZARD PAGE')).toBeTruthy();
  });

  it('does NOT redirect when the company override is a dashboard preset', () => {
    profileState.profile = { onboarding_completed: false, company_id: 'co-1' };
    profileState.isProfileComplete = false;
    companyPresetState.companyPreset = 'dashboard_silent';

    renderAt('/dashboard');
    expect(screen.getByText('DASHBOARD')).toBeTruthy();
  });

  it('renders children for onboarding-complete users regardless of preset', () => {
    profileState.profile = { onboarding_completed: true, company_id: null };
    profileState.isProfileComplete = true;
    assessmentsState.data = [{ completed_at: '2025-01-01' }];

    renderAt('/dashboard');
    expect(screen.getByText('DASHBOARD')).toBeTruthy();
  });
});
