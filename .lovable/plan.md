

# User Subscription Tiers: Free vs Paid

## What This Solves

Today, "free vs paid" is a hardcoded `const isFree = true` in several files. There's no database backing, no admin toggle, and no way to test paid features. This plan adds a proper subscription tier system that admins can toggle per user, with admin users automatically getting full access to everything.

## Design Decisions

**Where to store subscription data**: A new `user_subscriptions` table (not on the profiles table) keeps subscription concerns separate from profile data. This follows the same pattern as `user_roles` — a dedicated table for access control.

**Tier levels**: Start simple with `free` and `paid`. The table includes a `tier` column using a new `subscription_tier` enum, making it easy to add more tiers later (e.g., `premium`, `enterprise`) without schema changes beyond extending the enum.

**Admin override**: Admins automatically get "paid" access everywhere — the `useSubscription` hook checks admin status first, so admins never need a subscription row.

## Database Changes

### New enum and table

```text
subscription_tier enum: 'free', 'paid'

user_subscriptions table:
  - id (uuid, PK)
  - user_id (uuid, references auth.users, unique)
  - tier (subscription_tier, default 'free')
  - started_at (timestamptz)
  - expires_at (timestamptz, nullable — for future use)
  - updated_at (timestamptz)
  - updated_by (uuid, nullable — tracks which admin changed it)
```

### RLS policies
- Users can read their own subscription
- Admins can read all, insert, update, and delete subscriptions

### Helper function
A `get_subscription_tier()` SQL function (security definer) that returns the tier for a given user, defaulting to `'free'` if no row exists. This keeps the logic centralized.

## New Hook: useSubscription

A React hook that combines subscription tier lookup with admin status:

```text
useSubscription() returns:
  - tier: 'free' | 'paid'
  - isFree: boolean
  - isPaid: boolean
  - isLoading: boolean
```

Logic: If user is admin, always return `isPaid = true`. Otherwise, query `user_subscriptions` for the user's tier, defaulting to `free`.

## Admin Panel Changes

### Users tab enhancements
Add a "Tier" column next to the existing "Admin" toggle in the Users table. Each user row will show:
- Current tier as a badge (Free / Paid)
- A toggle or dropdown to switch between Free and Paid
- When toggled, upserts into `user_subscriptions`

This reuses the existing `useAdminUsers` pattern — fetch subscription data alongside user/role data and display it in the same table.

## Replace Hardcoded isFree

Every place that currently has `const isFree = true` will be updated to use the new `useSubscription` hook:

1. **ChatThread.tsx** (line 239): Plan limit enforcement — `isFree` controls whether user is limited to 1 plan
2. **Edge function** (`rprx-chat/index.ts`): The `isFree` flag that controls auto vs manual mode — will read from user's subscription via a DB query in the edge function
3. **Any future feature gates**: The hook provides a single source of truth

## Files to Create

1. **`src/hooks/useSubscription.ts`** — The core hook
2. **Database migration** — New enum, table, RLS, and helper function

## Files to Modify

1. **`src/pages/AdminPanel.tsx`** — Add tier column/toggle to Users tab
2. **`src/components/assistant/ChatThread.tsx`** — Replace `const isFree = true` with `useSubscription()`
3. **`supabase/functions/rprx-chat/index.ts`** — Query subscription tier instead of hardcoding
4. **`src/integrations/supabase/types.ts`** — Will auto-update after migration

## Sequencing

1. Database migration (enum + table + RLS + function)
2. `useSubscription` hook
3. Admin Panel tier toggle
4. Replace hardcoded `isFree` references
5. Edge function subscription query

## Future-Proofing

- The `expires_at` column is included now (nullable) so when Stripe billing is integrated, subscriptions can auto-expire
- The enum can be extended with `ALTER TYPE subscription_tier ADD VALUE 'premium'` without breaking existing data
- The `updated_by` column creates an audit trail of which admin changed a user's tier

