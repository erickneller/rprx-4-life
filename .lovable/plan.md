

# Edit "Your Motivation" Feature

## Overview
Add the ability to edit the dream text directly from the Debt Eliminator dashboard, and rename it from "Your Dream" to "Your Motivation" for clearer messaging.

## Current State
- Dream text is captured during setup in `DreamStep.tsx`
- Displayed in `DebtDashboard.tsx` within the "Journey Progress" card as static text
- `updateJourney` mutation already exists in `useDebtJourney.ts` and supports updating `dream_text`
- No edit functionality on the dashboard

## Proposed Solution
Create an "Edit Motivation" dialog that allows users to update their motivation text. The display will be styled as its own prominent card to emphasize its importance.

---

## Implementation Details

### 1. Rename "Your Dream" to "Your Motivation"
Update labels in:
- `DreamStep.tsx` - wizard step title and labels
- `DebtDashboard.tsx` - display section

### 2. New Component: EditMotivationDialog
A dialog similar to `EditDebtDialog` that allows updating the motivation text:

**Features:**
- Opens from an edit button on the motivation display
- Textarea pre-filled with current motivation
- Same inspiration prompts as the setup step
- Save and Cancel buttons
- Uses existing `updateJourney` mutation

### 3. New Component: MotivationCard
Extract the motivation display from the Journey Progress card into its own component:

**Features:**
- Prominent display with sparkle/star icon
- "Your Motivation" header
- Quoted text display
- Edit button (pencil icon)
- If no motivation set, show a prompt to add one

### 4. Dashboard Integration
- Replace inline dream display in Journey Progress with the new `MotivationCard`
- Pass `updateJourney` mutation to dashboard for the edit dialog
- Add state management for showing/hiding the edit dialog

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/debt-eliminator/dashboard/MotivationCard.tsx` | Motivation display with edit button |
| `src/components/debt-eliminator/dashboard/EditMotivationDialog.tsx` | Dialog for editing motivation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/debt-eliminator/setup/DreamStep.tsx` | Rename labels to "Your Motivation" |
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Add MotivationCard, remove inline dream display, wire up edit dialog |
| `src/pages/DebtEliminator.tsx` | Pass `updateJourney` to dashboard |

---

## User Experience

### Motivation Card Display
```text
+--------------------------------------------------+
| ✨ Your Motivation                      [Edit ✏️] |
|                                                  |
| "Take a dream vacation without worrying about    |
|  money"                                          |
+--------------------------------------------------+
```

### Edit Dialog
```text
+--------------------------------------------------+
| Edit Your Motivation                         [X] |
+--------------------------------------------------+
|                                                  |
| Why do you want to be debt-free?                 |
| +----------------------------------------------+ |
| | Take a dream vacation without worrying about | |
| | money                                        | |
| +----------------------------------------------+ |
|                                                  |
| Need inspiration?                                |
| [Take a dream vacation...] [Buy a home...]       |
| [Start my own business] [Retire early...]        |
|                                                  |
|                      [Cancel]  [Save Motivation] |
+--------------------------------------------------+
```

### No Motivation Set
```text
+--------------------------------------------------+
| ✨ Your Motivation                               |
|                                                  |
| What's driving you to become debt-free?          |
|                           [Add Motivation →]     |
+--------------------------------------------------+
```

---

## Technical Details

### EditMotivationDialog Props
```typescript
interface EditMotivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMotivation: string;
  onSave: (newMotivation: string) => void;
  isLoading: boolean;
}
```

### MotivationCard Props
```typescript
interface MotivationCardProps {
  motivation: string | null;
  onEdit: () => void;
}
```

### Dashboard Changes
```typescript
// Add state
const [showEditMotivation, setShowEditMotivation] = useState(false);

// Add handler using updateJourney from props
const handleSaveMotivation = (text: string) => {
  updateJourney.mutate({ dream_text: text }, {
    onSuccess: () => setShowEditMotivation(false)
  });
};
```

---

## Label Updates

| Location | Old Text | New Text |
|----------|----------|----------|
| DreamStep title | "What's Your Dream?" | "What's Your Motivation?" |
| DreamStep subtitle | "...your motivation throughout the journey" | "...keep you focused on your goal" |
| DreamStep label | Your "Why" | Your Motivation |
| Dashboard display | "Your Dream" | "Your Motivation" |
| Celebration text | "Time to live your dream!" | "Time to live your motivation!" |

