## Goal
Collapse the tier model to **free / partner / pro** everywhere, and migrate all existing `paid` users to `partner`. Today the DB enum still has a legacy `paid` value and the code carries dual logic for it, which is why gating feels inconsistent.

## Current state
- DB enum `subscription_tier` = `free | paid | partner | pro`
- `user_subscriptions`: 3 users on `free`, 2 users on `paid` (incl. `a@a.com`), 0 on `partner`/`pro`
- `useSubscription.ts` returns `'paid'` as its own tier and treats it as "any paying"
- `upgradeFeatures.ts` ranks `paid` and `partner` equally (rank 1) — so route gating *should* already let `paid` through to the Equity Calculator. The inconsistency is the dual code paths and label confusion, not a hard block.

## Plan

### 1. DB migration — normalize tier values
- Update every `user_subscriptions.tier = 'paid'` → `'partner'` (also `tier_override`)
- Update `ghl_product_tier_map.tier = 'paid'` → `'partner'`
- Drop `'paid'` from the `subscription_tier` enum (rebuild enum as `free | partner | pro`, cast columns)
- Leave `get_subscription_tier()` as-is — it will now only ever return `free | partner | pro`

### 2. Frontend — remove the `paid` branch
- `src/hooks/useSubscription.ts`: change `SubscriptionTier` to `'free' | 'partner' | 'pro'`; drop the `isPaid = tier === 'paid' || ...` legacy line; keep `isPaid` as a derived alias of "partner or higher" for backward compatibility with existing call sites.
- `src/lib/upgradeFeatures.ts`: remove `'paid': 1` from `TIER_RANK` (no longer reachable).
- Grep call sites of `'paid'` literal and `isPaid` and confirm none depend on the legacy meaning. Expected touch points: billing UI labels, admin user table tier badge, useSubscription consumers.

### 3. Admin UI sanity
- Confirm the admin user-management screen's tier dropdown lists only `free / partner / pro` after the enum change (it reads from the enum).

### 4. Verify
- Reload `a@a.com` → sidebar shows Equity Calculator unlocked, `/calculators/equity-recapture` loads without UpgradeModal.
- Spot-check Plans, Debt Eliminator, Library, Partners (all `partner`-gated) load for `a@a.com`.
- Spot-check Virtual Advisor still shows the upgrade gate (no `pro` users exist yet, as you confirmed).

## Out of scope
- No new admin controls, no Stripe/GHL webhook changes, no UI redesign. Pure normalization.

## Tier mapping going forward
| Tier | Who | Unlocks |
|---|---|---|
| `free` | Default | Dashboard, profile, assessment, results |
| `partner` | Paying members | + Strategy Assistant, Plans, Debt Eliminator, Library, Partners, **Equity Recapture Calculator** |
| `pro` | Reserved | Currently nothing exclusive — placeholder for Virtual Advisor / Family Overview when those launch |
