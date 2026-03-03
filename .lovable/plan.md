

# Assessment Completion — Analysis and Plan

## Current State

After auditing the code, here is what `submitAssessment` in `useAssessment.ts` currently does and what's missing:

| Write | Status | Details |
|-------|--------|---------|
| 1. completed_at + primary_horseman | Already correct | Set during `user_assessments.insert()` at line 225-240 |
| 2. Money leak estimate → profiles | Missing | No code writes `estimated_annual_leak_low/high` after assessment |
| 3. Onboarding progress row | Already correct | `startOnboarding(user.id)` at line 286 does upsert with `ignoreDuplicates` |
| 4. Auto-generate plan + activate strategy | Missing | Only triggered later by Day 1 CTA button on dashboard |
| 5. Navigate to dashboard | Partially wrong | Currently navigates to `/results/${assessment.id}`, not `/dashboard` |
| Error handling | Missing | Currently throws on any failure, blocking everything |
| Tie-breaking | Already correct | `determinePrimaryHorseman` iterates interest→taxes→insurance→education, uses strict `>`, so first-encountered max wins — matches requested order |

## What Needs to Change

### File: `src/hooks/useAssessment.ts`

**A. Add money leak calculation (Write 2)**

After scoring, derive income bracket from `profile.monthly_income` and apply horseman multiplier per the spec. Round to nearest $500. Write to `profiles.estimated_annual_leak_low` and `profiles.estimated_annual_leak_high`. This is a simple Supabase update — no new tables or functions needed.

**B. Wire auto-plan generation (Write 4)**

The `autoGenerateStrategy` function requires `sendMessage` and `createPlan` — both come from React hooks (`useSendMessage`, `useCreatePlan`). The `useAssessment` hook must accept these as parameters.

Update the hook signature to accept `sendMessage` and `createPlan` as optional deps. After writing the assessment + leak estimate + onboarding row, call `autoGenerateStrategy` with those deps. Skip if a focus plan already exists for the user. If the AI call fails, log and continue — do not block navigation.

The `AssessmentWizard` component will need to pass these down from `useSendMessage()` and `useCreatePlan()`.

**C. Change navigation target (Write 5)**

Navigate to `/dashboard` instead of `/results/${assessment.id}`.

**D. Sequential error handling with graceful degradation**

Wrap each write in its own try/catch. Log step-by-step. If writes 1 (assessment record) fails, stop entirely. For writes 2-4, log errors but continue to next step. After all writes, navigate to dashboard. If any non-critical write failed, show a toast: "We're still setting up your plan — check back in a moment."

### File: `src/components/assessment/AssessmentWizard.tsx`

Add `useSendMessage()` and `useCreatePlan()` hooks, pass `sendMessage` and `createPlan` into `useAssessment()`.

### New utility (inline in useAssessment or separate helper)

Money leak bracket calculator:

```text
monthly_income < 3500       → low: 500,  high: 1500
3500 ≤ income < 5000        → low: 1000, high: 3000
5000 ≤ income < 7500        → low: 1500, high: 4000
7500 ≤ income < 10000       → low: 2000, high: 5000
income ≥ 10000              → low: 3000, high: 8000

Horseman multipliers (applied to high):
  interest: 1.3, taxes: 1.2, insurance: 1.0, education: 0.9

Round both to nearest $500.
```

## Files Modified

- `src/hooks/useAssessment.ts` — add money leak calc, accept sendMessage/createPlan, sequential error handling, navigate to /dashboard
- `src/components/assessment/AssessmentWizard.tsx` — wire new hook deps
- `src/lib/moneyLeakEstimator.ts` — add `calculateInitialLeakEstimate()` helper (optional, could inline)

No database changes needed — all target columns already exist in the `profiles` and `user_onboarding_progress` tables.

