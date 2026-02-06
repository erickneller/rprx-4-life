

# Implement Debt Management Functionality

## Problem
The Debt Eliminator dashboard displays debts correctly, but users cannot:
- Add new debts to an existing journey
- Edit existing debt details (name, balance, interest rate, etc.)
- Log payments against debts
- Delete debts

The buttons exist in the UI but have no functionality wired up.

## Solution
Add the missing mutations, create dialog modals, and wire everything together.

## Implementation Steps

### 1. Extend useDebtJourney Hook
Add new mutations to `src/hooks/useDebtJourney.ts`:
- `addDebt` - Insert a new debt to the active journey
- `updateDebt` - Update debt details (name, balances, rates)
- `deleteDebt` - Remove a debt from the journey
- `logPayment` - Record a payment, update current balance, and check if paid off

### 2. Create AddDebtDialog Component
New file: `src/components/debt-eliminator/dashboard/AddDebtDialog.tsx`
- Modal dialog with form fields for debt type, name, balances, interest rate, minimum payment
- Reuse styling from existing DebtEntryForm component
- Submit calls the new `addDebt` mutation

### 3. Create EditDebtDialog Component
New file: `src/components/debt-eliminator/dashboard/EditDebtDialog.tsx`
- Modal dialog pre-populated with existing debt data
- Allow editing all fields except debt type
- Include delete button with confirmation
- Submit calls `updateDebt` mutation

### 4. Create LogPaymentDialog Component
New file: `src/components/debt-eliminator/dashboard/LogPaymentDialog.tsx`
- Modal dialog showing current balance
- Input for payment amount with validation (cannot exceed current balance)
- Optional note field
- Preview new balance after payment
- Submit calls `logPayment` mutation which:
  - Creates a debt_payments record
  - Updates user_debts.current_balance
  - Sets paid_off_at if balance reaches zero

### 5. Update DebtDashboard Component
Modify `src/components/debt-eliminator/dashboard/DebtDashboard.tsx`:
- Add state for managing which dialog is open
- Wire "Add Debt" button to open AddDebtDialog
- Pass debt mutations from hook to component

### 6. Update DebtCard Component
Modify `src/components/debt-eliminator/dashboard/DebtCard.tsx`:
- Add `onEdit` callback prop alongside existing `onLogPayment`
- Make card clickable to open edit dialog
- Wire "Log Payment" button to parent callback

### 7. Update DebtEliminator Page
Modify `src/pages/DebtEliminator.tsx`:
- Destructure new mutations from useDebtJourney
- Pass mutations to DebtDashboard

## Database Interactions

All tables and RLS policies already exist:

```text
user_debts table:
  - INSERT: Users can create their own debts
  - UPDATE: Users can update their own debts
  - DELETE: Users can delete their own debts

debt_payments table:
  - INSERT: Users can create their own payments
  - All required columns: debt_id, user_id, amount, payment_type, note
```

## New Files
- `src/components/debt-eliminator/dashboard/AddDebtDialog.tsx`
- `src/components/debt-eliminator/dashboard/EditDebtDialog.tsx`
- `src/components/debt-eliminator/dashboard/LogPaymentDialog.tsx`

## Modified Files
- `src/hooks/useDebtJourney.ts` - Add mutations
- `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` - Wire up dialogs
- `src/components/debt-eliminator/dashboard/DebtCard.tsx` - Add edit callback
- `src/pages/DebtEliminator.tsx` - Pass mutations to dashboard

## Technical Details

### Log Payment Flow
```text
User clicks "Log Payment"
       |
       v
LogPaymentDialog opens
       |
       v
User enters amount
       |
       v
Submit triggers logPayment mutation:
  1. INSERT into debt_payments (debt_id, user_id, amount, payment_type)
  2. UPDATE user_debts SET current_balance = current_balance - amount
  3. IF current_balance = 0, SET paid_off_at = now()
       |
       v
Invalidate queries to refresh UI
       |
       v
Show success toast + celebration if paid off!
```

### Form Validation
- Payment amount: Must be > 0 and <= current balance
- Debt name: Required, non-empty
- Balances: Must be >= 0
- Current balance: Cannot exceed original balance when editing

