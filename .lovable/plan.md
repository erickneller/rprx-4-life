

# Sync Profile Cash Flow with Debt Eliminator

## Overview
Connect the Debt Eliminator to use live profile cash flow data, so when users update their profile, the debt recommendations automatically recalculate. Add a visible cash flow status indicator on the dashboard with a link to update it in the profile.

## Current State
- `debt_journeys.monthly_surplus` is set once during wizard setup
- Profile has separate fields: `monthly_income`, `monthly_debt_payments`, `monthly_housing`, `monthly_insurance`, `monthly_living_expenses`
- These two data sources are not connected after initial setup
- Updating profile does NOT recalculate debt recommendations

## Proposed Solution
Use profile cash flow as the **single source of truth**. The Debt Eliminator will compute `monthly_surplus` on-the-fly from profile data, ensuring both features stay in sync.

---

## Implementation Details

### 1. Remove Redundant Storage
Remove the `monthly_surplus` column from `debt_journeys` table since we'll compute it from profile data in real-time. This prevents data from getting out of sync.

### 2. Update DebtEliminator Page
Fetch profile data alongside journey data and compute surplus from profile fields:

```typescript
// In DebtEliminator.tsx
const { profile } = useProfile();

// Compute surplus from profile (same logic as CashFlowSection)
const computedSurplus = useMemo(() => {
  if (!profile?.monthly_income) return null;
  
  const income = Number(profile.monthly_income) || 0;
  const debt = Number(profile.monthly_debt_payments) || 0;
  const housing = Number(profile.monthly_housing) || 0;
  const insurance = Number(profile.monthly_insurance) || 0;
  const living = Number(profile.monthly_living_expenses) || 0;
  
  return income - (debt + housing + insurance + living);
}, [profile]);
```

Pass this computed surplus to the Dashboard instead of `journey.monthly_surplus`.

### 3. Update DebtDashboard Component
- Accept `profile` or `cashFlowData` as a prop instead of relying on journey data
- Use the computed surplus for recommendation calculations
- Display the cash flow status indicator at the top

### 4. New Component: CashFlowStatusCard
Create a compact card showing the current cash flow status with a link to the profile:

```text
+--------------------------------------------------+
| 💰 Monthly Surplus: $850                         |
|    Status: Healthy Surplus                       |
|                           [ Update in Profile → ]|
+--------------------------------------------------+
```

**Features:**
- Shows computed surplus amount (positive/negative)
- Shows status label (Surplus/Tight/Deficit)
- Color-coded based on status (green/yellow/red)
- Link/button navigates to `/profile` (with anchor to cash flow section if possible)

### 5. Update Setup Wizard
The wizard's `CashFlowStep` should still capture cash flow, but save directly to the `profiles` table instead of `debt_journeys`. This ensures consistency from day one.

### 6. Handle Missing Cash Flow Data
If user has no cash flow in profile:
- Show a prompt in place of the status card: "Add your cash flow snapshot to get personalized recommendations"
- Include a CTA button to go to profile
- Default recommendation engine to highest APR fallback

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/DebtEliminator.tsx` | Compute surplus from profile, pass to dashboard |
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Accept computed surplus, add CashFlowStatusCard |
| `src/hooks/useDebtJourney.ts` | Remove `monthly_surplus` from journey creation |
| `src/components/debt-eliminator/setup/SetupWizard.tsx` | Save cash flow to profile only |

## File to Create

| File | Purpose |
|------|---------|
| `src/components/debt-eliminator/dashboard/CashFlowStatusCard.tsx` | Status display with profile link |

## Database Migration

```sql
-- Remove the cached surplus column since we compute from profile
ALTER TABLE debt_journeys DROP COLUMN IF EXISTS monthly_surplus;
```

---

## User Experience

### On Dashboard (with cash flow data)
```text
+--------------------------------------------------+
| 💰 Cash Flow Snapshot                            |
| Surplus: $850/mo        Status: Healthy Surplus  |
|                           [ Update in Profile → ]|
+--------------------------------------------------+
|                                                  |
| 🎯 YOUR FOCUS: Chase Visa                        |
| (uses the $850 surplus for payoff calculations)  |
+--------------------------------------------------+
```

### On Dashboard (missing cash flow data)
```text
+--------------------------------------------------+
| 📊 Complete Your Cash Flow                       |
| Add your income and expenses to get personalized |
| debt recommendations.                            |
|                           [ Go to Profile →     ]|
+--------------------------------------------------+
|                                                  |
| 🎯 YOUR FOCUS: Chase Visa                        |
| (defaults to highest APR since no surplus data)  |
+--------------------------------------------------+
```

### When Profile is Updated
1. User goes to `/profile`
2. Updates cash flow fields
3. Saves profile
4. Returns to Debt Eliminator
5. Recommendations automatically reflect new surplus
   - (React Query invalidates profile, triggers re-render, useMemo recalculates)

---

## Technical Flow

```text
Profile Updated
      |
      v
useProfile() returns new data
      |
      v
DebtEliminator useMemo() recalculates surplus
      |
      v
DebtDashboard receives new surplus
      |
      v
getDebtRecommendation() runs with new surplus
      |
      v
UI updates with new recommendation
```

---

## Benefits
- Single source of truth for cash flow data
- Automatic sync - no manual refresh needed
- Transparent to user - they can see the surplus being used
- Easy to update - direct link to profile
- Consistent - same calculation used in profile preview and debt recommendations

