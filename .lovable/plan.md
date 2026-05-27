
# Admin-Managed GHL Checkout Links

Move the 4 checkout URLs (Partner Monthly/Yearly, Pro Monthly/Yearly) + public funnel URL out of hardcoded `ghlCheckoutConfig.ts` and into the existing `feature_flags` table so admins can update them without a redeploy. Also support pasting GHL's full **iframe embed snippet** (not just a URL) for a better in-app checkout experience.

## What the user will see

- New admin tab **"Checkout Links"** (inside `/admin`) with 5 cards: Partner Monthly, Partner Yearly, Pro Monthly, Pro Yearly, Public Funnel.
- Each card: a mode toggle (**URL** / **Embed snippet**), a textarea, Save button, and a small "Last updated" note.
- The `UpgradeModal` keeps its current Partner/Pro × Monthly/Yearly tabs and renders whichever the admin saved (URL → iframe with that src; Embed → the pasted snippet). When blank, current "not configured yet" message stays.

## Storage

Single `feature_flags` row, id `ghl_checkout_config`, `value` = JSON string:

```json
{
  "partner": {
    "month": { "mode": "url", "value": "https://..." },
    "year":  { "mode": "embed", "value": "<iframe ...></iframe><script ...></script>" }
  },
  "pro":     { "month": { "mode": "url", "value": "" }, "year": {...} },
  "publicFunnel": "https://link.rprx4life.com/pricing"
}
```

No migration needed — `feature_flags` already exists with admin-write RLS.

## Files

**New**
- `src/hooks/useCheckoutConfig.ts` — `useCheckoutConfig()` (read) + `useUpdateCheckoutConfig()` (admin write), mirroring `useCourseBannerSettings`. Falls back to current hardcoded defaults when row missing/blank.
- `src/components/admin/CheckoutLinksTab.tsx` — 5 cards UI with URL/Embed toggle + Save.

**Edited**
- `src/lib/ghlCheckoutConfig.ts` — Keep current values as `DEFAULT_CHECKOUT_CONFIG`. Add `CheckoutSlot = { mode: 'url'|'embed', value: string }` types. `buildCheckoutUrl` stays for URL mode; add `isEmbed(slot)` helper.
- `src/components/billing/UpgradeModal.tsx` — Replace hardcoded `buildCheckoutUrl` call with config-driven lookup. If `mode === 'embed'`, render the sanitized snippet via `dangerouslySetInnerHTML` inside the iframe container. If `mode === 'url'`, keep today's `<iframe src>` flow. Show "not configured yet" when `value` is empty.
- `src/pages/AdminPanel.tsx` — Add new tab "Checkout Links" pointing to `CheckoutLinksTab`.

**Untouched** — `ghl-checkout-webhook` edge function, `ghl_product_tier_map`, `useSubscription`, anything in the auth/dashboard flow.

## Security

- `feature_flags` already restricts writes to admins via RLS.
- Embed mode uses `dangerouslySetInnerHTML`. Mitigation: client-side allowlist — the saved HTML must contain only `<iframe>` and `<script>` tags whose `src` references `link.rprx4life.com`, `*.leadconnectorhq.com`, or `*.msgsndr.com` (GHL's CDN). Reject on Save with a clear error if anything else is present. Admin-only path + allowlist = acceptable risk for an admin-gated modal.

## Out of scope

- No changes to the public landing-page funnel button beyond reading `publicFunnel` from the same config.
- No edits to the webhook, product map, or subscription tier logic.
- No Stripe/legacy w2 checkout URLs.

Once approved I'll implement in build mode.
