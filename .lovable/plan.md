## Diagnosis

The database and network response are correct: `a@a.com` resolves to `partner`, and the Equity Recapture Calculator nav row requires `partner`.

The current failure is frontend timing/state related:
- Sidebar items calculate `locked` before subscription/admin loading is fully resolved.
- A temporary default `free` tier can mark the calculator locked and open the upgrade modal.
- The route guard can also redirect to `/dashboard` while auth/subscription/navigation data is still settling.
- The modal iframe shows a broken document because the checkout URLs are still placeholder `REPLACE_*` URLs, but that modal should not open for a partner user clicking a partner feature anyway.

## Implementation plan

1. **Make subscription loading explicit and safe**
   - Update `useSubscription` so it does not report a usable `free` tier while auth/admin/subscription checks are still pending.
   - Keep the legacy `paid -> partner` normalization and the `v2` query key.
   - Make query enablement wait for admin status to finish, so non-admin subscription fetches are not skipped due to a temporary admin-loading state.

2. **Prevent sidebar false locks during loading**
   - Update `AppSidebar` / `NavItemRow` to consume `isLoading` from `useSubscription`.
   - While subscription state is loading, do not treat partner/pro routes as locked and do not open the upgrade modal from a transient `free` default.
   - Keep real locks once loading is complete.

3. **Harden route guard against premature redirects**
   - Update `UpgradeRouteGuard` to wait for subscription loading and sidebar config loading before computing the final access decision.
   - Reset its one-shot `fired` flag when access becomes allowed so a stale blocked state cannot keep forcing upgrade behavior.

4. **Clean the checkout modal failure mode**
   - Add a guard in `UpgradeModal`/checkout config so placeholder checkout URLs do not render as a broken iframe.
   - Show a clear “checkout link not configured” state instead. This avoids the sad-file iframe if a truly locked feature is clicked before live GHL checkout URLs are added.

## Validation

After implementation:
- Reload as `a@a.com`.
- Confirm `get_subscription_tier` returns `partner`.
- Confirm Equity Recapture Calculator is not locked in the sidebar.
- Confirm navigating to `/calculators/equity-recapture` stays on the calculator route and does not open the upgrade modal or redirect to `/dashboard`.
- Confirm Pro-only features, like Virtual Advisor if configured as `pro`, still gate correctly.