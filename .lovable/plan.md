

## Fix: Admin Panel link bouncing back to /dashboard

**Root cause:** Race condition in `src/components/auth/AdminRoute.tsx`. The `useAdmin()` hook uses `useQuery` with `enabled: !!user`. On the very first render after auth resolves, React Query reports `isLoading: false` and `isAdmin: false` (the default) for one tick before the query actually starts. AdminRoute's check `if (!isAdmin) return <Navigate to="/dashboard" />` fires during that tick and silently bounces admins back to the dashboard — exactly what the screenshot shows.

The `has_role` RPC in your network log returned `true`, confirming the user IS admin. The bug is purely in the gate's loading-state logic.

### Fix (2 small files)

**1. `src/hooks/useAdmin.ts`** — return a proper "not yet checked" state.
- Replace `isLoading` with `isPending` (or expose `status`).
- React Query's `isPending` is `true` until the query has actually resolved at least once when `enabled` is true; combined with `enabled: !!user`, the consumer can distinguish "waiting" from "checked and false".

**2. `src/components/auth/AdminRoute.tsx`** — wait for the admin check to actually complete before redirecting.
- Change the loading guard from `if (authLoading || adminLoading)` to also include the case where `user` exists but the admin query hasn't returned yet.
- Concretely: gate on `authLoading || (!!user && adminPending)` and only evaluate `isAdmin` after the query has settled.

### Result
- Admin user clicks "Admin Panel" → sees the spinner for one frame → `/admin` renders normally.
- Non-admin user → still correctly redirected to `/dashboard` after the role check resolves (no flash, no bounce).

### Notes
- No DB, RLS, or schema changes.
- No impact on other gated routes (they use `ProtectedRoute`/`WizardGuard`, untouched).
- Same pattern applies to any future role-gated routes.

