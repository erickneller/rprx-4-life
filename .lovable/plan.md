## Problem

The Company Dashboard "Tier" column currently renders `profiles.current_tier`, which is the **gamification** tier (bronze/silver/gold style), not the **subscription** tier the rest of the app uses (`free` / `partner` / `pro`). That's inconsistent with how users are classified everywhere else (sidebar locks, upgrade gates, admin views).

## Fix

Align the company members table with the app-wide subscription tiers.

### 1. Migration — extend `company_dashboard_stats`
Add a `subscription_tier text` column to the function's return, pulled via the existing `get_subscription_tier(cm.user_id)` helper (so RLS + override logic stays in one place). Leave `current_tier` in place so nothing else breaks.

### 2. `src/hooks/useCompanyDashboard.ts`
Add `subscription_tier: 'free' | 'partner' | 'pro'` to `CompanyMemberStats`. Normalize the legacy `'paid'` string to `'partner'` (same as `useSubscription`).

### 3. `src/pages/CompanyDashboard.tsx`
- Rename the "Tier" column header to "Plan".
- Render `m.subscription_tier` instead of `m.current_tier`, with a small variant map:
  - `pro` → default badge
  - `partner` → secondary badge
  - `free` → outline badge
- Capitalize for display ("Free" / "Partner" / "Pro").

### 4. (Optional, same pass) Stats tile
Add a small "Paid Members" count = members where `subscription_tier !== 'free'`, so the company admin sees adoption at a glance. Skip if you'd rather keep the 4-card layout untouched — say the word.

## Out of scope
- No change to gamification tier logic or `profiles.current_tier`.
- No change to `get_subscription_tier` itself.
- No change to upgrade/billing flows.
