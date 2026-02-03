
# RPRx Rapid Debt Eliminator - Implementation Plan

## Overview
A gamified debt elimination module that allows users to track multiple debts, log payments, visualize progress, and earn badges for milestones. The experience includes a dream/goal visualization to keep users motivated.

---

## User Flow

```
1. Welcome Screen → Intro to the Debt Eliminator concept
2. Goal Selection → Choose debt type(s) to focus on
3. Debt Entry → Add debts (type, name, balance, rate, min payment)
4. Set Your Dream → Define the "why" for becoming debt-free
5. Dashboard → Progress overview, debt list, journey map
6. Log Payment → Record payments or update balances
7. Milestones & Badges → Earn achievements as progress is made
8. Settings → Edit debts, update dream, FAQ
```

---

## Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `debt_journeys` | User's debt elimination journey (dream, start date, status) |
| `user_debts` | Individual debts being tracked |
| `debt_payments` | Payment history for each debt |
| `user_badges` | Badges earned by users |
| `badges` | Badge definitions (static/seeded) |

### Schema Details

**debt_journeys**
- id, user_id, dream_text, dream_image_url (optional), status (active/completed/paused), created_at, completed_at

**user_debts**
- id, journey_id, user_id, debt_type (enum), name, original_balance, current_balance, interest_rate, min_payment, created_at, paid_off_at

**debt_payments**
- id, debt_id, user_id, amount, payment_type (payment/balance_update), note, created_at

**badges** (seeded data)
- id, name, description, icon, criteria_type, criteria_value, category

**user_badges**
- id, user_id, badge_id, earned_at

### Enums
- `debt_type`: credit_card, student_loan, auto_loan, mortgage, personal_loan, medical, other
- `journey_status`: active, completed, paused

---

## File Structure

```
src/
├── pages/
│   ├── DebtEliminator.tsx              # Main entry point
│   └── DebtJourneySetup.tsx            # Wizard for new journey
│
├── components/
│   └── debt-eliminator/
│       ├── setup/
│       │   ├── WelcomeStep.tsx
│       │   ├── GoalSelectionStep.tsx
│       │   ├── DebtEntryStep.tsx
│       │   ├── DebtEntryForm.tsx
│       │   ├── DreamStep.tsx
│       │   └── SetupWizard.tsx
│       │
│       ├── dashboard/
│       │   ├── DebtDashboard.tsx
│       │   ├── ProgressOverview.tsx
│       │   ├── DebtList.tsx
│       │   ├── DebtCard.tsx
│       │   ├── JourneyMap.tsx
│       │   ├── DreamVisualization.tsx
│       │   └── QuickStats.tsx
│       │
│       ├── payments/
│       │   ├── LogPaymentModal.tsx
│       │   ├── UpdateBalanceModal.tsx
│       │   └── PaymentHistory.tsx
│       │
│       ├── badges/
│       │   ├── BadgeDisplay.tsx
│       │   ├── BadgeGrid.tsx
│       │   ├── BadgeUnlockAnimation.tsx
│       │   └── MilestoneProgress.tsx
│       │
│       └── settings/
│           ├── DebtSettings.tsx
│           ├── EditDebtModal.tsx
│           └── EditDreamModal.tsx
│
├── hooks/
│   ├── useDebtJourney.ts
│   ├── useUserDebts.ts
│   ├── useDebtPayments.ts
│   ├── useUserBadges.ts
│   └── useDebtCalculations.ts
│
└── lib/
    ├── debtTypes.ts                    # Type definitions
    ├── debtCalculations.ts             # Interest saved, time saved, etc.
    └── badgeEngine.ts                  # Badge criteria checking
```

---

## Implementation Phases

### Phase 1: Foundation (Database + Setup Wizard)
1. Create database tables with RLS policies
2. Seed badges table with initial badge definitions
3. Build setup wizard (Welcome → Goal → Debts → Dream)
4. Add route `/debt-eliminator` and navigation link

### Phase 2: Dashboard Core
1. Build main dashboard layout
2. Implement debt list with cards
3. Create progress overview component
4. Add dream visualization section
5. Implement journey map (visual progress indicator)

### Phase 3: Payment Tracking
1. Build "Log Payment" modal
2. Build "Update Balance" modal
3. Create payment history view
4. Implement automatic calculations (interest saved, time saved)

### Phase 4: Badges & Milestones
1. Create badge display components
2. Implement badge checking engine
3. Add milestone progress indicators
4. Create simple unlock animation (CSS-based)

### Phase 5: Polish
1. Add settings/edit functionality
2. Responsive design refinements
3. Empty states and loading states
4. FAQ/help section

---

## Key Components Detail

### Setup Wizard
Similar to existing Assessment wizard - multi-step form with progress indicator. Steps:
1. **Welcome**: Intro text, "Start Your Journey" CTA
2. **Goal Selection**: Multi-select debt types to track
3. **Debt Entry**: Form for each debt (can add multiple)
4. **Dream Setting**: Text input + optional image upload for their "why"

### Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│ Header: "Your Debt Freedom Journey"             │
├────────────────────┬────────────────────────────┤
│ Progress Overview  │ Dream Visualization        │
│ - Total Paid       │ - User's dream text/image  │
│ - Interest Saved   │ - Days until freedom       │
│ - Time Saved       │   (estimated)              │
├────────────────────┴────────────────────────────┤
│ Journey Map (visual progress bar/path)          │
├─────────────────────────────────────────────────┤
│ Your Debts                          [+ Add Debt]│
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Credit Card │ │ Auto Loan   │ │ Student Loan││
│ │ $2,400      │ │ $8,500      │ │ $15,000     ││
│ │ ████░░░░ 60%│ │ ██░░░░░░ 25%│ │ █░░░░░░░ 12%││
│ │ [Log Payment]│ │ [Log Payment]│ │ [Log Payment]││
│ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────┤
│ Badges & Milestones                             │
│ 🏆 First Payment  🎯 10% Paid  🔒 25% Paid     │
└─────────────────────────────────────────────────┘
```

### Badge System (MVP Badges)

| Badge | Criteria |
|-------|----------|
| First Step | Log first payment |
| Week Warrior | Log payments 2 weeks in a row |
| 10% Club | Pay off 10% of total debt |
| Quarter Way | Pay off 25% of total debt |
| Halfway Hero | Pay off 50% of total debt |
| Almost There | Pay off 75% of total debt |
| Debt Destroyer | Pay off a single debt completely |
| Freedom Fighter | Complete entire journey |

---

## Calculations

### Interest Saved
Compare actual payoff vs minimum-payment-only scenario:
```typescript
interestSaved = projectedInterestAtMinPayments - actualInterestPaid
```

### Time Saved
```typescript
timeSaved = projectedPayoffDateAtMinPayments - actualPayoffDate
```

### Progress Percentage
```typescript
progressPercent = (totalOriginalBalance - totalCurrentBalance) / totalOriginalBalance * 100
```

---

## Navigation Integration

Add to `AppSidebar.tsx`:
```typescript
{ title: "Debt Eliminator", url: "/debt-eliminator", icon: Target }
```

---

## Security (RLS Policies)

All tables will have RLS enabled with user_id-based policies:
- Users can only read/write their own journey, debts, payments, and badges
- Badges table is read-only for all authenticated users

---

## Technical Considerations

1. **Badge Checking**: Run badge criteria checks after each payment logged (client-side initially, could move to database trigger later)

2. **Calculations**: Compute interest/time saved client-side using standard amortization formulas

3. **Optional Image Upload**: Use existing Supabase storage bucket or create a new one for dream images

4. **Animations**: Use Tailwind/CSS animations for badge unlocks (no heavy animation library needed)

---

## Estimated Implementation Order

| Order | Task | Files |
|-------|------|-------|
| 1 | Database schema + migrations | SQL migrations |
| 2 | Type definitions | `lib/debtTypes.ts` |
| 3 | Setup wizard + hooks | Pages + components |
| 4 | Dashboard shell | Dashboard components |
| 5 | Payment logging | Payment components + hooks |
| 6 | Calculations engine | `lib/debtCalculations.ts` |
| 7 | Badge system | Badge components + engine |
| 8 | Polish & settings | Settings components |
