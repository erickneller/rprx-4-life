
# Add Assessment Exit Warning Dialog

## Overview
When users click "Exit Assessment" during an in-progress assessment, show a warning dialog explaining that incomplete assessments are not saved and encouraging them to complete it.

## Current Behavior
- The "Exit Assessment" button navigates directly to `/dashboard` without any confirmation
- Users may accidentally lose their progress without realizing it

## New Behavior
- Clicking "Exit Assessment" opens a warning dialog
- Dialog explains that only completed assessments are saved
- Encourages users to take 2-3 minutes to finish
- Provides clear options: "Continue Assessment" (primary) or "Exit Anyway"

## Implementation

### 1. Create ExitAssessmentDialog Component
New file: `src/components/assessment/ExitAssessmentDialog.tsx`

Dialog content:
- **Title**: "Exit Assessment?"
- **Message**: Explains that incomplete assessments are not saved, progress will be lost, and encourages completion (2-3 minutes)
- **Primary Action**: "Continue Assessment" (green button to match the app's success color)
- **Secondary Action**: "Exit Anyway" (outline button)

### 2. Update AssessmentWizard Component
Modify `src/components/assessment/AssessmentWizard.tsx`:
- Add state to track if exit dialog is open
- Change "Exit Assessment" button to open the dialog instead of navigating directly
- Handle dialog actions (continue or exit)

## Files to Create
- `src/components/assessment/ExitAssessmentDialog.tsx`

## Files to Modify
- `src/components/assessment/AssessmentWizard.tsx`

## Technical Details

### Dialog Structure
```text
+------------------------------------------+
|  Exit Assessment?                    [X] |
+------------------------------------------+
|                                          |
|  Your progress will not be saved.        |
|  Only completed assessments are saved    |
|  to your profile.                        |
|                                          |
|  The assessment only takes 2-3 minutes   |
|  to complete. We encourage you to        |
|  finish it now!                          |
|                                          |
+------------------------------------------+
|  [Exit Anyway]      [Continue Assessment]|
+------------------------------------------+
```

### Component Props
```typescript
interface ExitAssessmentDialogProps {
  open: boolean;
  onContinue: () => void;  // Close dialog, stay on assessment
  onExit: () => void;      // Navigate to dashboard
}
```

### Button Styling
- "Continue Assessment": `bg-accent hover:bg-accent/90 text-accent-foreground` (blue, primary action)
- "Exit Anyway": `variant="outline"` (secondary action)

## User Flow
```text
User clicks "Exit Assessment"
        |
        v
Dialog opens with warning
        |
        +---> [Continue Assessment] ---> Dialog closes, user stays
        |
        +---> [Exit Anyway] ---> Navigate to /dashboard
        |
        +---> [X] or click outside ---> Dialog closes, user stays
```
