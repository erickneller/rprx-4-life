## Problem

When an admin sets the RPRx Library (or any other nav item) to **Free** in the Navigation/Library admin tabs, clicking the sidebar link still opens the Upgrade modal. The DB-driven `required_tier='free'` is being ignored in favor of the legacy hardcoded gating.

## Root cause

Two places fall back to the legacy `FEATURE_TIER` map (which has `library: 'partner'`) even when the DB row explicitly says `free`:

1. **`src/components/layout/AppSidebar.tsx`** — `NavItemRow`:
   ```ts
   const locked = dbTier !== 'free'
     ? !tierMeets(tier, dbTier)
     : (featureKey ? isLocked(featureKey) : false); // ← legacy fallback fires when admin chose Free
   ```
2. **`src/components/auth/UpgradeRouteGuard.tsx`** — uses only the hardcoded `FEATURE_TIER`, so even after fixing the sidebar, navigating directly to `/library` (or any guarded route) redirects to dashboard and opens the modal.

## Fix

1. **AppSidebar** — Treat the DB `required_tier` as authoritative for any row that has the column. Compute `locked = !tierMeets(tier, dbTier)` directly. Drop the legacy `isLocked(featureKey)` fallback. Pass `requiredTier: dbTier` to `requireUpgrade` unconditionally.

2. **UpgradeRouteGuard** — Accept an optional DB-driven tier override. For routes backed by a sidebar nav row (Library, Plans, Partners, Strategy Assistant, Debt Eliminator, Virtual Advisor), look up the corresponding `sidebar_nav_config.required_tier` via `useSidebarConfig` and use it instead of `FEATURE_TIER[feature]`. Fall back to `FEATURE_TIER` only when no DB row exists.

   Concretely: add a small helper `useRouteRequiredTier(feature)` that:
   - Reverses `NAV_ITEM_FEATURE` to find the nav row id for the feature.
   - Reads that row from `useSidebarConfig` and returns its normalized `required_tier`.
   - Returns `FEATURE_TIER[feature]` as fallback.

   Then `UpgradeRouteGuard` uses that hook for `required` and skips the redirect when `required === 'free'`.

3. No DB or admin-UI changes needed — the existing "Required Tier" dropdown already writes the correct value.

## Files touched

- `src/components/layout/AppSidebar.tsx` — simplify `locked` computation in `NavItemRow`.
- `src/components/auth/UpgradeRouteGuard.tsx` — consume DB-driven tier.
- `src/lib/upgradeFeatures.ts` *(optional)* — export a `FEATURE_NAV_ITEM` reverse map for the new hook.
- `src/hooks/useSidebarConfig.ts` *(optional, only if a tier lookup helper is added here)*.

## Verification

- Set Library `required_tier = free` in admin → free user clicks sidebar Library → page loads, no modal.
- Set Library `required_tier = partner` → free user clicks → modal opens with Partner preselected; Partner user loads page.
- Set Library `required_tier = pro` → Partner user sees lock + modal with Pro preselected.
- Direct URL `/library` honors the same DB tier (no redirect when Free).
