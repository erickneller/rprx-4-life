

## Fix: Assessment completion bouncing user back to Wizard Step 1

### Root cause

After `submitAssessment()` writes the assessment and calls `navigate('/results/:id')`, the `WizardGuard` wrapping `/results/:id` runs. Two state values feed its decision:

1. `isProfileComplete` from `useProfile` — should be `true` after the wizard.
2. `assessments` from `useAssessmentHistory` — its React Query cache is **never invalidated** when the new assessment row is inserted directly via the Supabase client. On `/results/:id`'s first render the query is in `loading → fetched empty` (or stale cached `[]` from earlier) for one tick, so `hasAssessments = false`.

When both line up unfavorably (any single profile field momentarily missing — e.g. `tax_advantaged_accounts` dropped, a non-critical write failed earlier, or `useProfile`'s cache returns the pre-wizard snapshot), `WizardGuard` fires `Navigate('/wizard')`. `ProfileWizard` then mounts fresh, `useState` initializes `form` to `null`s before `profile` finishes loading, and the user sees **Step 1 of 4 with blank inputs**. The form state never re-syncs after `profile` arrives, so blank stays blank.

A secondary contributor: when a critical write throws inside `submitAssessment`, the catch block only flips `isSubmitting` off — the user gets no toast and no retry, masking real failures.

### Fix (5 small, surgical changes)

**1. `src/hooks/useAssessment.ts` — invalidate caches and surface errors**
- Inject `useQueryClient`. Right before `navigate('/results/${assessment.id}')`, invalidate `['assessmentHistory', user.id]`, `['assessment', assessment.id]`, and `['profile', user.id]` so guards see the new assessment immediately.
- In the `catch` block, show a destructive toast: "We couldn't save your assessment. Please try again." so failures are visible (not silent). Keep `isSubmitting` reset.
- Add a small `console.log` of the response/decision points already partially present, plus one final "navigating to /results/:id" log.

**2. `src/components/auth/WizardGuard.tsx` — make `/results` and `/dashboard` always reachable post-assessment**
- Add `/results` to `ALLOWED_PATHS`. A user who has just completed an assessment must always be allowed to view results — regardless of any transient profile re-evaluation.
- Strengthen the wizard-redirect rule: only redirect to `/wizard` when `!hasAssessments` AND `!isProfileComplete` AND `!profile.onboarding_completed`. If the user has even one completed assessment, never bounce to the wizard. (Today the code already gates on `!hasAssessments`, but the assessments query can briefly return empty due to cache; combined with the new allowlist entry this becomes safe.)
- While `useAssessmentHistory` is in `isFetching` state on protected routes, treat as "loading" instead of evaluating against a stale empty array (use `isPending` / `isFetched`-style gating, mirroring the `AdminRoute` fix pattern).

**3. `src/components/wizard/ProfileWizard.tsx` — re-sync form when profile arrives**
- Replace lazy `useState(() => …)` initialization with a `useEffect` that hydrates the form from `profile` once when it first becomes non-null. This guarantees that even if the wizard ever remounts post-completion, all fields show the saved values (no more "blank Step 1").
- Add an early `useEffect` redirect: if `profile && isProfileComplete && profile.onboarding_completed === false`, navigate the user forward to `/dashboard` (or `/results` if they were trying to reach results) instead of restarting the wizard. The wizard should never be shown to a user who already has a complete profile.

**4. `src/pages/Index.tsx` — defensive parity with WizardGuard**
- When `isProfileComplete && !profile.onboarding_completed`, send the user to `/dashboard` (current behavior). When the user has at least one completed assessment in `useAssessmentHistory`, never route to `/wizard` even if `isProfileComplete` momentarily flips false. This prevents `/` from being a bounce path for users mid-onboarding.

**5. `src/hooks/useProfile.ts` — invalidate after direct DB writes (light touch)**
- Export a small `refetchProfile` helper that returns `queryClient.invalidateQueries({ queryKey: ['profile', user.id] })`. Call it from `submitAssessment` after the profiles update so any consumer reading `isProfileComplete` sees the freshly written record and not a pre-write snapshot.

### Verification steps
- New invite-link tester: complete wizard → start assessment → finish 15 core + 5 deep dive → click **Complete Assessment** → lands on `/results/:id`, no flash, no bounce.
- Reload `/results/:id` → still renders results.
- Force a critical write to fail (e.g., revoke `assessment_responses` insert temporarily in dev) → user sees an error toast and stays on the deep-dive step with the **Complete Assessment** button re-enabled (no silent reset).
- Manually browse to `/wizard` after completion → user is forwarded to `/dashboard` instead of seeing Step 1.

### Files touched
- `src/hooks/useAssessment.ts`
- `src/components/auth/WizardGuard.tsx`
- `src/components/wizard/ProfileWizard.tsx`
- `src/pages/Index.tsx`
- `src/hooks/useProfile.ts`

### Out of scope
- No DB / RLS / schema changes.
- No changes to scoring, deep-dive, or strategy generation logic.
- No new dependencies.

