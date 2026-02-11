

# Add Delete Capability to Assessment History

## Overview
Add the ability to delete assessments individually or in bulk from the Assessment History section on the dashboard. This includes a selection mode with checkboxes, a delete button, and a confirmation dialog.

## User Experience

- A header toolbar appears above the assessment cards with a "Select" toggle button
- When in selection mode, each card shows a checkbox in its top-left corner
- A "Select All" checkbox and a "Delete Selected" button appear in the toolbar
- Clicking "Delete Selected" shows a confirmation dialog before permanently removing the assessments
- Single-delete is also available: each card gets a small trash icon (visible even outside selection mode) for quick one-off deletion with confirmation
- Deleting also removes the associated `assessment_responses` rows (cascade via SQL)

## Technical Details

### Database: Add CASCADE delete for assessment_responses
Currently `assessment_responses` references `assessment_id` but there's no ON DELETE CASCADE. We need a migration to ensure deleting an assessment automatically cleans up its responses.

```sql
-- Drop existing FK and re-add with CASCADE
ALTER TABLE assessment_responses
  DROP CONSTRAINT IF EXISTS assessment_responses_assessment_id_fkey,
  ADD CONSTRAINT assessment_responses_assessment_id_fkey
    FOREIGN KEY (assessment_id) REFERENCES user_assessments(id) ON DELETE CASCADE;
```

### File: `src/hooks/useAssessmentHistory.ts`
- Add a `useDeleteAssessments` mutation hook
- Accepts an array of assessment IDs
- Deletes from `user_assessments` (responses cascade automatically)
- Invalidates the `assessmentHistory` query cache on success
- Shows a success/error toast

### File: `src/components/dashboard/AssessmentHistory.tsx`
- Add state: `selectionMode` (boolean), `selectedIds` (Set of strings)
- Render a toolbar row with:
  - "Select" toggle button (enters/exits selection mode)
  - "Select All" checkbox (when in selection mode)
  - "Delete Selected (N)" button (when items are selected)
- Pass `selectionMode`, `isSelected`, and `onToggleSelect` props to each card
- Include an AlertDialog for delete confirmation

### File: `src/components/dashboard/AssessmentSummaryCard.tsx`
- Accept new optional props: `selectionMode`, `isSelected`, `onToggleSelect`, `onDelete`
- When `selectionMode` is true, show a Checkbox overlay on the card
- Always show a small trash icon button in the card header for single-delete
- Clicking the card in selection mode toggles selection instead of navigating

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add ON DELETE CASCADE to assessment_responses FK |
| `src/hooks/useAssessmentHistory.ts` | Add `useDeleteAssessments` mutation |
| `src/components/dashboard/AssessmentHistory.tsx` | Add selection mode, toolbar, confirmation dialog |
| `src/components/dashboard/AssessmentSummaryCard.tsx` | Add checkbox, trash icon, selection props |

