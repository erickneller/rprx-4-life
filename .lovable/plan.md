# Global Upgrade Gate (GHL embed everywhere)

Reuse the existing `UpgradeModal` (GHL iframe + affiliate/email/user_id prefill) and trigger it from a single global context so every paywall in the app opens the same popup.

## End-state flow

```text
  Free user clicks anything gated
            |
            v
  requireUpgrade({ feature, requiredTier })
            |
            v
  UpgradeGateProvider opens <UpgradeModal />
  (plan preselected: 'pro' if Pro-only, else 'partner')
            |
            v
  GHL form submits -> webhook -> tier flips -> modal auto-closes
```

## What gets built

### 1. `UpgradeGateProvider` (new)
`src/contexts/UpgradeGateContext.tsx` — wraps the app (mount inside `AuthenticatedLayout` + landing as needed). Exposes:

```ts
const { requireUpgrade, isLocked } = useUpgradeGate();

requireUpgrade({
  feature: 'strategy-assistant',   // for analytics/copy
  requiredTier: 'partner' | 'pro', // controls preselected tab
  interval?: 'month' | 'year',     // optional
});

isLocked(requiredTier) // true if current tier < required
```

Internally renders one `<UpgradeModal />` instance and stores `{plan, interval}` in state. Replaces the per-component modal instances in `Pricing.tsx` and `BillingCard.tsx` (they call `requireUpgrade` instead).

### 2. Feature → tier registry
`src/lib/upgradeFeatures.ts` — single source of truth so we don't sprinkle tier logic across the codebase:

```ts
export const FEATURE_TIER = {
  'strategy-assistant': 'partner',
  'plans':              'partner',
  'debt-eliminator':    'partner',
  'virtual-advisor':    'pro',
  'family-overview':    'pro',
  'partners-directory': 'partner',
  // …extend as needed
} as const;
```

### 3. `<LockedButton />` + `<UpgradeGate />` wrappers
`src/components/billing/LockedButton.tsx` — drop-in replacement for gated CTAs:

```tsx
<LockedButton feature="virtual-advisor">Book advisor session</LockedButton>
```

If user has access → renders children as a normal button.
If locked → renders with a small lock icon + opens modal on click (preselects Pro for `virtual-advisor`).

`<UpgradeGate feature="..." fallback={...}>{children}</UpgradeGate>` — wraps any region; shows fallback (blurred preview / "Unlock with Partner" card) for free users.

### 4. Sidebar lock affordance
`src/components/layout/AppSidebar.tsx` — for each nav item flagged `requiredTier`:
- Free user sees the item with a small lock icon and muted styling.
- Click intercepts navigation and calls `requireUpgrade({ feature, requiredTier })` instead of routing.
- Keeps discovery (users see what's behind the paywall) without dead links.

Nav config gets an optional `requiredTier?: 'partner' | 'pro'` field per item. Lookup defaults via `FEATURE_TIER` when omitted.

### 5. Route-level guard
`src/components/auth/UpgradeRouteGuard.tsx` — wrap paid routes in `App.tsx`:

```tsx
<Route element={<UpgradeRouteGuard requiredTier="pro" feature="virtual-advisor" />}>
  <Route path="/virtual-advisor" element={<VirtualAdvisor />} />
</Route>
```

If user lacks the tier: render the page underneath (so they see context) + auto-open the upgrade modal. On close without upgrade → redirect to `/dashboard`. Prevents direct-URL bypass.

### 6. Refactor existing callers
- `Pricing.tsx`: drop local modal state, call `requireUpgrade` from the plan buttons.
- `BillingCard.tsx`: same.
- Any existing "Upgrade to Pro" CTAs scattered in components (Strategy Assistant intake, Plans, etc.) → replace with `requireUpgrade` calls.

## Technical details

- `useSubscription().tier` already exposes `'free' | 'partner' | 'pro'`. Tier ranking: `free < partner < pro`. Centralize comparator in `upgradeFeatures.ts`.
- `UpgradeModal` already accepts `initialPlan` + `initialInterval`. No changes needed there besides exposing it via context.
- Provider mounts once, so the iframe isn't re-created when navigating — but it only renders when `open=true`, so no idle cost.
- Analytics hook (optional, future): log `{feature, requiredTier, action: 'gate_shown' | 'gate_dismissed' | 'gate_converted'}`.

## Out of scope (v1)

- Re-styling existing gated UIs beyond adding the lock icon + intercept.
- Per-feature custom upsell copy inside the modal (single generic modal for now; can add `feature` prop later to vary the title/subtitle).
- Soft trial / one-time peek flows.

## Order of work

1. `upgradeFeatures.ts` (registry + tier comparator).
2. `UpgradeGateContext.tsx` + provider mount in `AuthenticatedLayout`.
3. `LockedButton.tsx` + `UpgradeGate.tsx` wrappers.
4. `UpgradeRouteGuard.tsx` and wire into `App.tsx` paid routes.
5. Extend `AppSidebar` nav config with `requiredTier`, render lock + intercept.
6. Refactor `Pricing.tsx`, `BillingCard.tsx`, and other inline upgrade CTAs to use `requireUpgrade`.
7. Smoke test: free user clicks each gated nav item, gated button, and types in a paid URL — modal opens with correct plan tab; upgrade flips tier and auto-closes.
