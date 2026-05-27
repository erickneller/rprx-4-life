## Likely cause
DB is correct: `a@a.com` has `tier=partner`, the equity row's `required_tier=partner`, and `get_subscription_tier()` returns `partner`. So the gate is failing client-side, almost certainly from **stale state** carrying the legacy `'paid'` value:

- React Query has a cached `['subscription-tier', userId]` entry from before the migration. The defensive `raw === 'paid' ? 'partner'` mapping I added only runs **inside `queryFn`**, so a cached value never gets normalized.
- With `tier === 'paid'` reaching the guard, `TIER_RANK['paid']` is now `undefined` (I removed it), so `tierMeets('paid', 'partner')` returns `false` → `UpgradeRouteGuard` redirects to `/dashboard`. Same effect in `AppSidebar` (lock icon + UpgradeModal).
- A hard refresh would fix it, but the app should be self-healing.

## Fix

1. **`src/hooks/useSubscription.ts`** — normalize on read, not only in `queryFn`. After the `useQuery` call, coerce any legacy value: `const tier = (isAdmin ? 'pro' : (rawTier === 'paid' ? 'partner' : rawTier)) as SubscriptionTier;`. This catches stale cache entries and any in-flight `'paid'` values.

2. **`src/lib/upgradeFeatures.ts`** — add a defensive `'paid': 1` entry back to `TIER_RANK` so any stray `'paid'` string anywhere in the app ranks as partner instead of `undefined` → 0. Keep the public `RequiredTier` / `SubscriptionTier` unions at `free | partner | pro`; the extra rank key is purely a runtime safety net.

3. **One-time cache bump** — change the `useSubscription` query key from `['subscription-tier', user.id]` to `['subscription-tier', 'v2', user.id]` so any persisted/legacy cached `'paid'` entry is evicted on next mount. (Also update the matching `qc.invalidateQueries` / `qc.getQueryData` calls in `src/components/billing/UpgradeModal.tsx`.)

## Verify
- Reload `a@a.com` (no hard refresh needed). Sidebar shows Equity Recapture Calculator unlocked, click navigates to `/calculators/equity-recapture` and renders without redirect or UpgradeModal.
- Spot-check Plans / Debt Eliminator / Library / Partners still load.
- Virtual Advisor still triggers the upgrade modal (no `pro` users yet).

## Out of scope
No DB changes, no UI/UX redesign, no new admin controls.
