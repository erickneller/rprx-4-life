
## Problem

On **Admin Panel → Users**, ekneller@gmail.com shows **Free**, but he is effectively **Partner** because his company's plan is `partner`. The rest of the app (Admin Insights, sidebar gating, `useSubscription`) correctly resolves this via `public.get_subscription_tier()`, which checks:

1. `user_subscriptions.tier_override` → 2. `user_subscriptions.tier` → 3. `profiles.company_id` → `companies.plan` (partner/pro) → 4. `'free'`

The Admin Users tab in `src/components/admin/UsersTab.tsx` skips step 3 — it only reads `user_subscriptions`, so any user who inherits Partner/Pro from their company falsely displays as Free.

## Fix

In `src/components/admin/UsersTab.tsx` → `useAdminUsers()`:

- Replace the direct `user_subscriptions` select with the existing admin RPC **`admin_list_users_with_tier`** (already `SECURITY DEFINER`, admin-gated, and uses `get_subscription_tier` internally — same source of truth as Insights).
- Merge its `tier` field into each row keyed by `user_id`, keeping the existing `admin_list_users` fields for phone, name, status, etc.
- Keep the `user_roles` fetch as-is for `is_admin` / `is_library_admin`.
- Fallback to `'free'` only if the RPC has no row for that user (shouldn't happen, but safe).

## Tier dropdown (unchanged behavior, small clarifier)

The inline tier `<Select>` still writes to `user_subscriptions` as an override — that's the correct mechanism for manually promoting a user above their inherited tier. No change to `useToggleTier`. After the RPC-based read, the displayed value will reflect either the override or the inherited company tier, matching the rest of the app.

## Verification

- Reload Admin → Users: ekneller should now show **Partner**.
- Other users with `user_subscriptions` rows should show the same tier as before.
- Tier filter dropdown continues to work against the new values.

## Files touched

- `src/components/admin/UsersTab.tsx` — swap the tier data source in `useAdminUsers` (~10 lines).

No DB migration, no schema change, no other files affected.
