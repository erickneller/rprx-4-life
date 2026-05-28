## What happened

Production users saw "checkout not configured" while the admin tab showed the correct URLs. The DB row was fine the whole time (current `feature_flags.ghl_checkout_config.value` is intact, 706 chars of valid JSON, last user-save at 16:34 UTC). Re-saving from admin "fixed" it only because it forced a fresh refetch of the same row.

That pattern points to a **silent client-side fallback**, not a data loss. There are four fragility points in `src/hooks/useCheckoutConfig.ts` and `useFeatureFlag.ts` that can each independently cause production to render the empty default config — and the default contains the placeholder `REPLACE_…` URLs which `parse()` strips to empty strings, which `UpgradeModal` then renders as "not configured".

### Root-cause candidates (all real, ranked by likelihood)

1. **Auth-not-ready race (most likely).** RLS on `feature_flags` requires the `authenticated` role. `useCheckoutConfig` fires on mount with no `enabled` guard. If the Supabase session hasn't attached yet (common on a cold load after a fresh deploy), the SELECT returns 0 rows or errors → React Query returns `undefined` → the hook returns `DEFAULT_CHECKOUT_CONFIG` (placeholders → empty). No toast, no retry surface. Once the user clicked "Save all", the mutation ran after auth was ready and invalidated the cache, so the next read succeeded.
2. **Silent parse fallback.** `parse()` returns `DEFAULT_CHECKOUT_CONFIG` for any non-string / invalid-JSON / null value. There's no logging and no admin-side warning. Any one-time bad write (or a transient `null` from Postgrest) is invisible.
3. **Shared queryKey collision.** `['feature-flag', flagId]` is used by `useFeatureFlag` (returns `boolean`), `useCheckoutConfig`, `useBookingUrl`, `useBillingCardSettings`, `useCourseBannerSettings`, `useFirstLoginFlow`, `useAdvisorLink`. Today no caller passes `'ghl_checkout_config'` to `useFeatureFlag`, but the next time someone does, the cache will hold the wrong shape and the typed consumer will silently render defaults.
4. **No safety net in `UpgradeModal`.** When the slot value is blank, the modal shows "not configured" with no fallback to the public funnel URL — so a transient load failure becomes a hard "you can't pay us" screen.

## Fix plan (one patch, frontend only, no DB changes)

### 1. Make `useCheckoutConfig` resilient
File: `src/hooks/useCheckoutConfig.ts`
- Add `retry: 3` with exponential backoff and `refetchOnWindowFocus: true` so a transient RLS / network blip self-heals.
- On query error, log `console.error('[checkout-config] load failed', err)` so we can see it in production console logs instead of silently falling back.
- In `parse()`, when input is non-string or `JSON.parse` throws, also log a warning with the raw value type so a corrupted row is visible.
- Change the placeholder filter: instead of `url.includes('REPLACE_') ? '' : url`, keep returning empty for the placeholder, but expose an `isDefault` flag on the returned config so callers know the data is the fallback, not the saved value.
- Lower `staleTime` to `30_000` and add `gcTime: 5 * 60_000`.

### 2. Stop the queryKey collision risk
Files: `src/hooks/useCheckoutConfig.ts`, `useBookingUrl.ts`, `useBillingCardSettings.ts`, `useCourseBannerSettings.ts`, `useFirstLoginFlow.ts`, `useAdvisorLink.ts`
- Rename the typed-flag query keys from `['feature-flag', FLAG_ID]` to `['feature-flag-value', FLAG_ID]` (boolean-only `useFeatureFlag` keeps `['feature-flag', flagId]`).
- Update each hook's matching `invalidateQueries` calls to the new key.
- Net effect: `useFeatureFlag` and the typed hooks can never share a cache entry again.

### 3. Harden `UpgradeModal` so users can always pay
File: `src/components/billing/UpgradeModal.tsx`
- When the resolved slot is blank, instead of only showing "not configured", also render a **"Continue to public pricing"** button that links to `config.publicFunnel` (falls back to `GHL_PUBLIC_FUNNEL_URL`). The user can still complete purchase even if the per-plan slot failed to load.
- Show a small "Retry" button that calls `qc.invalidateQueries({ queryKey: ['feature-flag-value', 'ghl_checkout_config'] })`.

### 4. Surface load failures in admin
File: `src/components/admin/CheckoutLinksTab.tsx`
- If `useCheckoutConfig` returns `isDefault === true` (i.e. nothing was actually loaded from the DB), show a destructive banner: "Saved config could not be loaded — saving now will overwrite the live config with whatever is on screen. Refresh first." This prevents an admin from accidentally blanking the row while React Query is in its fallback state.

### 5. Verification

After the patch, verify in one pass:
- `rg -n "queryKey: \['feature-flag', FLAG_ID\]" src` returns no hits in typed-flag hooks.
- Open `/admin` → Checkout Links: existing URLs render (no fallback banner).
- Open the upgrade modal logged-in: iframe loads.
- Throttle network in DevTools, hard-reload the modal page: confirm retry succeeds; if it fails, the "Continue to public pricing" fallback button is visible.
- Console shows no `[checkout-config] load failed` on a normal load.

## Out of scope

- No DB migration. The current row is valid; the bug is in how the client handles transient failures.
- No change to `ghlCheckoutConfig.ts` static defaults (still contain `REPLACE_…` so we can detect placeholder state).
- No change to `Pricing.tsx` (it already uses `buildPublicFunnelUrl` directly and was never affected).
