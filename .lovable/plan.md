

## Plan: Select Plan as Dashboard Focus + Free Tier Limits

### Recommended Sequencing

Build in two phases: first the plan-selection infrastructure (which all users need), then the free-tier enforcement on top.

---

### Phase 1: Select a Plan as Dashboard Focus

**Goal**: Allow users to designate one of their saved plans as their "Current Focus" on the dashboard, replacing the current debt-only focus.

#### 1a. Add `is_focus` column to `saved_plans`

- Add a boolean `is_focus` column (default `false`) to the `saved_plans` table
- Create a database trigger that ensures only one plan per user can have `is_focus = true` at a time (setting a new focus automatically clears the old one)

```text
ALTER TABLE saved_plans ADD COLUMN is_focus boolean NOT NULL DEFAULT false;

-- Trigger: when a plan is set as focus, clear any other focused plan for that user
CREATE OR REPLACE FUNCTION clear_other_focus_plans()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_focus = true THEN
    UPDATE saved_plans
    SET is_focus = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_focus = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_clear_focus
BEFORE UPDATE ON saved_plans
FOR EACH ROW EXECUTE FUNCTION clear_other_focus_plans();
```

#### 1b. Add "Set as Focus" action to Plan Cards

**File: `src/components/plans/PlanCard.tsx`**
- Add a "Set as Focus" button (or star/pin icon) on each plan card
- Calls `updatePlan({ id, is_focus: true })` via the existing `useUpdatePlan` hook

#### 1c. Update `usePlans` hook

**File: `src/hooks/usePlans.ts`**
- Add `is_focus` to the `SavedPlan` interface and `toSavedPlan` mapper
- Add a convenience query `useFocusPlan()` that returns the single plan where `is_focus = true`

#### 1d. Update Dashboard Focus Card

**File: `src/components/dashboard/DashboardContent.tsx`**
- Import the new `useFocusPlan()` hook
- When a focus plan exists, show a `CurrentFocusCard` populated with the plan's title, strategy name, and checklist progress (completed steps / total steps)
- "Continue Focus" navigates to `/plans/{planId}`
- The existing debt-focus logic remains as a secondary focus or fallback

---

### Phase 2: Free Tier Enforcement

**Goal**: Limit free-tier users to 1 saved plan and 1 focus at a time.

#### 2a. Add tier awareness

- For now, treat all users as "free" (no subscription table yet). This makes enforcement simple: check `plans.length >= 1` before allowing saves.
- When a paid tier is introduced later, the guard simply checks the user's tier.

#### 2b. Block saving additional plans

**File: `src/components/plans/SavePlanButton.tsx` (or SavePlanModal)**
- Before saving, check existing plan count
- If free tier and already has 1 plan, show a message: "Free accounts are limited to 1 active plan. Delete your current plan or upgrade to save more."

#### 2c. Guard on the backend (edge function)

**File: `supabase/functions/rprx-chat/index.ts`**
- When auto-saving a plan, query the user's plan count first
- If at limit, skip auto-save and include a note in the response suggesting they manage existing plans

#### 2d. Visual indicator on Plans page

**File: `src/pages/Plans.tsx`**
- Show a subtle banner for free users: "Free plan: 1 of 1 plans used" with an upgrade CTA placeholder

---

### Technical Summary

| Change | File(s) |
|--------|---------|
| DB migration: `is_focus` column + trigger | New migration |
| Focus plan query hook | `src/hooks/usePlans.ts` |
| "Set as Focus" UI on plan cards | `src/components/plans/PlanCard.tsx` |
| Dashboard focus from plan | `src/components/dashboard/DashboardContent.tsx` |
| Free-tier save guard (frontend) | `src/components/plans/SavePlanModal.tsx` |
| Free-tier save guard (backend) | `supabase/functions/rprx-chat/index.ts` |
| Free-tier banner | `src/pages/Plans.tsx` |

### Notes

- Phase 1 can be built and tested independently before any monetization decisions.
- The debt eliminator focus remains independent -- it's a module-level focus, not the dashboard focus.
- When Stripe is integrated later, the free-tier guards simply swap from `const isFree = true` to checking the user's subscription status.

