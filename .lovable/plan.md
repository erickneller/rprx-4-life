## What is coded where

- **Admin-controlled tier setting:** `src/components/admin/NavigationTab.tsx`
  - This edits `sidebar_nav_config.required_tier`.
  - The Equity Recapture row is currently `partner` in Supabase, so admin settings are correct.

- **Sidebar lock / upgrade modal:** `src/components/layout/AppSidebar.tsx`
  - `NavItemRow` reads each nav row's `required_tier` and opens the upgrade modal when `tierMeets(tier, required_tier)` fails.

- **Route redirect to dashboard:** `src/components/auth/UpgradeRouteGuard.tsx`
  - This wraps `/calculators/equity-recapture` and redirects to `/dashboard` if the tier check fails.

- **Route wiring:** `src/App.tsx`
  - The calculator route is wrapped with `<UpgradeRouteGuard feature="equity-recapture-calculator" />`.

## Why it keeps happening

The database state is not the problem:
- `a@a.com` effective tier = `partner`
- Equity Recapture Calculator required tier = `partner`

The recurring failure is a frontend state/race issue. The app has multiple independent `useAuth()` instances instead of one shared auth context. After visiting `/admin`, several guards/sidebar components remount and refetch auth/admin/subscription state independently. During that transition, one part of the UI can temporarily see a default/free or unresolved tier and incorrectly:
- render the calculator nav row as locked,
- open the upgrade modal,
- or redirect the route guard back to `/dashboard`.

The earlier patch reduced one timing issue, but the root is still that auth/subscription/admin state is duplicated and not centrally coordinated.

## Implementation plan

1. **Create a shared auth provider**
   - Convert `useAuth` from per-call local state into a React context provider.
   - Mount the provider once near the app root, inside `QueryClientProvider` and above route guards/sidebar.
   - Keep the same `useAuth()` API so existing components do not need broad rewrites.

2. **Make subscription/admin loading deterministic**
   - Update `useAdmin` and `useSubscription` to use the shared auth state.
   - Ensure subscription fetch waits until auth is known and admin role resolution is not in a transient state.
   - Continue mapping legacy `paid` to `partner`.

3. **Centralize admin navigation access behavior**
   - Keep `sidebar_nav_config.required_tier` as the authority for the sidebar and route guard.
   - Remove dependence on hardcoded fallback tier for Equity Recapture when the DB row exists.
   - Ensure changing the admin navigation setting invalidates the sidebar query only, not the user's subscription tier.

4. **Harden the route guard**
   - In `UpgradeRouteGuard`, do not redirect or open upgrade while auth/admin/subscription/nav config is still loading.
   - Add a small dev-only log around denied access so future cases show: current tier, required tier, feature, route, and matched nav row.

5. **Harden the sidebar click path**
   - In `AppSidebar`, do not show locked state or fire `requireUpgrade` until subscription loading is complete.
   - Treat admin-set `free`, `partner`, and `pro` consistently using the same `tierMeets` helper.

## Validation

- Confirm Supabase still shows calculator required tier as whatever is set in Admin Panel Navigation.
- As `a@a.com`, visit `/admin`, then click Equity Recapture Calculator.
- Expected: no modal, no dashboard redirect, calculator page loads.
- Change calculator tier in Admin Panel Navigation:
  - `free`: all signed-in users pass.
  - `partner`: partner/pro users pass.
  - `pro`: only pro/admin pass.
- Confirm the route and sidebar match the admin setting exactly.