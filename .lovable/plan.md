

# Profile Wizard + Admin Editor + Resume Logic

## Overview

Build a 4-step profile wizard for new users, an admin editor for wizard copy, resume logic for incomplete profiles, and update `isProfileComplete`.

## Part 1 -- Admin "Wizard Copy" Tab

**New file: `src/components/admin/WizardCopyTab.tsx`**

- Fetch all rows from `wizard_step_content` ordered by `step_number`
- For each row, display: step label (read-only), title (editable input), subtitle (editable input), Save button
- On save, update the row in `wizard_step_content` via Supabase
- Follow the same UI pattern as `OnboardingTab` (table with inline editing or simple cards)

**Edit: `src/pages/AdminPanel.tsx`**

- Add a new tab "Wizard Copy" that renders `<WizardCopyTab />`

## Part 2 -- Profile Wizard Component

**New file: `src/components/wizard/ProfileWizard.tsx`**

A 4-step wizard + completion screen. On mount, fetches `wizard_step_content` rows and uses their `title`/`subtitle` for each step header. Never hardcodes these strings.

- Progress bar: "Step X of 4"
- Back button on steps 2-4, hidden on step 1
- Each step saves to `profiles` on "Next" via `useProfile().updateProfile`
- Dollar inputs formatted with `$`, no negatives
- Mobile-first, max-width 480px centered

**Step 1 -- Financial Snapshot** (maps to `wizard_step_1`):
- Monthly take-home income (monthly_income)
- Monthly debt payments (monthly_debt_payments, 0 valid)
- Monthly housing (monthly_housing)
- Monthly insurance premiums (monthly_insurance, 0 valid)
- Monthly living expenses (monthly_living_expenses)
- Emergency fund balance (emergency_fund_balance, 0 valid)
- Filing status (filing_status) -- select dropdown
- Employer 401k match (employer_match_captured) -- select dropdown

**Step 2 -- Your Situation** (maps to `wizard_step_2`):
- Number of dependent children (num_children, 0 valid)
- Insurance coverage (multi-select checkboxes, "None" mutually exclusive)
- Financial goals (multi-select, min 1)

**Step 3 -- Retirement Picture** (maps to `wizard_step_3`):
- Years until retirement (years_until_retirement)
- Desired annual retirement income (desired_retirement_income)
- Current retirement savings (retirement_balance_total, 0 valid)
- Monthly retirement contribution (retirement_contribution_monthly, 0 valid)
- Static helper text beneath subtitle

**Step 4 -- Money Mindset** (maps to `wizard_step_4`):
- Stress: money worry (stress_money_worry) -- tap-friendly cards
- Stress: emergency confidence (stress_emergency_confidence) -- tap-friendly cards
- Stress: control feeling (stress_control_feeling) -- tap-friendly cards

**Completion screen** (maps to `wizard_complete`):
- Shows title/subtitle from DB
- CTA: "Start My Assessment" -- navigates to `/assessment`
- Does NOT set `onboarding_completed = true`

**New file: `src/hooks/useWizardContent.ts`**
- Fetches `wizard_step_content` rows, returns a map by id for easy lookup

## Part 3 -- Wizard Page + Routing

**New file: `src/pages/Wizard.tsx`**
- Renders `ProfileWizard` without `AuthenticatedLayout` (clean full-screen experience)
- Protected route

**Edit: `src/App.tsx`**
- Add `/wizard` route as a protected route

**Edit: `src/pages/Index.tsx`**
- After phone check passes, check `isProfileComplete`:
  - If false AND user has no completed assessments, redirect to `/wizard`
  - If false but has assessments, redirect to `/profile` (returning user editing)
  - If true, redirect to `/dashboard`

## Part 4 -- Resume Logic

**Edit: `src/components/auth/ProtectedRoute.tsx`** (or create a wrapper)
- For users with `onboarding_completed = false` navigating to routes other than `/wizard`, `/assessment`, `/complete-phone`, `/profile`, `/auth`:
  - Redirect to `/wizard` at the first step with missing required fields
  - Show a persistent banner at the top: "Complete your profile to unlock your RPRx Score" with a CTA link back to `/wizard`

Implementation approach: Rather than modifying `ProtectedRoute` (which doesn't have profile context), create a new `<WizardGuard>` wrapper component used inside authenticated routes that checks profile completion and redirects/shows banner as needed.

**New file: `src/components/auth/WizardGuard.tsx`**
- Uses `useProfile` to check `isProfileComplete` and `onboarding_completed`
- Uses `useAssessmentHistory` to check if user has any assessments
- If incomplete and no assessments, redirects to `/wizard`
- Otherwise renders children with an optional banner

## Part 5 -- Updated `isProfileComplete`

**Edit: `src/hooks/useProfile.ts`**

Update the `isProfileComplete` computed value to check ALL required fields:
- full_name, phone, monthly_income, monthly_debt_payments, monthly_housing, monthly_insurance, monthly_living_expenses, emergency_fund_balance, filing_status, employer_match_captured
- num_children (not null/undefined), financial_goals (length >= 1)
- years_until_retirement, desired_retirement_income, retirement_balance_total, retirement_contribution_monthly
- stress_money_worry, stress_emergency_confidence, stress_control_feeling
- At least one insurance boolean is true (health/life/disability/long_term_care/no_insurance)
- Explicitly EXCLUDE profile_type

## File Summary

| File | Action |
|------|--------|
| `src/hooks/useWizardContent.ts` | New -- fetch wizard_step_content |
| `src/components/wizard/ProfileWizard.tsx` | New -- 4-step wizard component |
| `src/pages/Wizard.tsx` | New -- wizard page |
| `src/components/admin/WizardCopyTab.tsx` | New -- admin editor for wizard copy |
| `src/components/auth/WizardGuard.tsx` | New -- redirect/banner for incomplete profiles |
| `src/hooks/useProfile.ts` | Edit -- update isProfileComplete |
| `src/pages/Index.tsx` | Edit -- add wizard redirect logic |
| `src/App.tsx` | Edit -- add /wizard route |
| `src/pages/AdminPanel.tsx` | Edit -- add Wizard Copy tab |

## Key Decisions

- **No DB migration needed** -- wizard_step_content already exists with data and RLS
- The wizard saves each step to profiles immediately on "Next", so progress survives app close
- `onboarding_completed` is NOT set by the wizard -- that happens after assessment + focus plan
- The wizard is a standalone full-screen page (no sidebar) for a focused onboarding experience
- Resume logic uses a `WizardGuard` wrapper rather than modifying `ProtectedRoute`, keeping concerns separated
- Dollar formatting uses a simple `$` prefix pattern with input masking, preventing negative values
- The stress questions in Step 4 use the values specified in the prompt (Never/Sometimes/Often/Always etc.), which differ slightly from the existing Profile page options -- the wizard will use the prompt-specified values

