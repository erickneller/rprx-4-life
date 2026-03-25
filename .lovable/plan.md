

# Redirect to Results Page After Assessment Completion

## Problem
After completing the assessment and deep dive, the user is always sent to `/dashboard` (line 441 in `useAssessment.ts`). They should land on the results page showing their assessment results.

## Fix

### `src/hooks/useAssessment.ts`
Change the navigation target from `/dashboard` to `/results/${assessment.id}` so the user sees their results immediately after submission.

- Line 441: change `navigate('/dashboard')` to `navigate(`/results/${assessment.id}`)`
- The `assessment.id` is already available at this point (created in Write 1, line 244-259)
- The non-critical failure toast still shows if needed, but the user lands on results either way

One-line change.

