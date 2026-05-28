## Root cause

`companies.plan = 'partner'` is set correctly for `Tester3`, but `get_subscription_tier(_user_id)` only reads `public.user_subscriptions`. New users who join a company via `/join?token=…` never get a `user_subscriptions` row created, so the RPC returns the `'free'` fallback. Nothing in `useCompany.joinByToken` (or anywhere else in the Join flow) writes the company plan to the user.

Confirmed via DB:
- `companies` row for the token: `plan = 'partner'`, `first_login_flow = null`.
- `get_subscription_tier` body returns `COALESCE((SELECT tier_override||tier FROM user_subscriptions …), 'free')` — no company lookup.

## Fix (single source of truth)

Make the company plan the authoritative fallback inside the SECURITY DEFINER RPC. This automatically corrects every existing joined user too — no backfill race, no client-side writes.

### 1. Migration — update `get_subscription_tier`

```sql
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    -- 1. Explicit per-user subscription / admin override wins
    (SELECT COALESCE(tier_override, tier)::text
       FROM public.user_subscriptions
       WHERE user_id = _user_id
       LIMIT 1),
    -- 2. Otherwise inherit the company plan the user belongs to
    (SELECT c.plan
       FROM public.profiles p
       JOIN public.companies c ON c.id = p.company_id
       WHERE p.id = _user_id
         AND c.plan IN ('partner','pro')
       LIMIT 1),
    'free'
  )
$$;
```

Notes:
- Filter `c.plan IN ('partner','pro')` so a company row with `plan='free'` or NULL doesn't shadow anything.
- `useSubscription.ts` already normalizes `'paid' → 'partner'`; no client changes needed.
- The function stays STABLE / SECURITY DEFINER, so RLS on `profiles`/`companies` is bypassed safely (returns only the tier string).

### 2. Verification queries (run after migration)

```sql
-- Tester3 members should now resolve to 'partner'
SELECT p.id, p.email, public.get_subscription_tier(p.id) AS tier
FROM profiles p
WHERE p.company_id = 'bba2c02c-66d0-4e2a-a718-13d6ac63824a';
```

Expected: every row returns `partner`.

### 3. Optional follow-up (not in this patch)

When admins change `companies.plan`, the cached `['subscription-tier', userId]` React Query stays warm for 5 min. If you want instant propagation, we can add a Realtime subscription on `companies` to invalidate `['subscription-tier']` — happy to do that as a separate change if you want it.

## Out of scope

- No changes to `useCompany.joinByToken` (avoids the failure mode where the insert silently fails and the user is permanently stuck free).
- No changes to GHL webhook / checkout flow — those already write `user_subscriptions` directly and continue to take precedence.
