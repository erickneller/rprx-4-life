

## Modify Dashboard CTA Visibility Based on Active Focus

### Overview
Toggle visibility of the "Your Current Focus" card and the "Start Assessment" CTA based on a mocked `activeFocus` boolean flag. When a user has an active focus, the focus card is shown and the assessment CTA is hidden. When there is no active focus, the reverse applies.

### Technical Details

**File: `src/components/dashboard/DashboardContent.tsx`**
- Add a mocked `activeFocus` boolean (hardcoded to `true` for now, easily toggled for testing).
- Conditionally render `<CurrentFocusCard />` only when `activeFocus` is `true`.
- Conditionally render `<StartAssessmentCTA />` only when `activeFocus` is `false`.
- No changes to `<CashFlowStatusCard />` or `<AssessmentHistory />`.

```text
Before:
  <CurrentFocusCard />
  <CashFlowStatusCard ... />
  <StartAssessmentCTA ... />
  <AssessmentHistory />

After:
  {activeFocus && <CurrentFocusCard />}
  <CashFlowStatusCard ... />
  {!activeFocus && <StartAssessmentCTA ... />}
  <AssessmentHistory />
```

**No other files are changed.** The `CurrentFocusCard` and `StartAssessmentCTA` components remain untouched.

