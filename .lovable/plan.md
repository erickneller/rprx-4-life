# Editable Upgrade Modal Header

Make the "Upgrade your plan" title and the description below it editable from the admin **Checkout Links** tab.

## Storage

Extend the existing `ghl_checkout_config` feature flag JSON with a `header` object:

```json
{
  "partner": { ... },
  "pro": { ... },
  "publicFunnel": "...",
  "header": {
    "title": "Upgrade your plan",
    "description": "Secure checkout powered by GoHighLevel. You'll stay logged in here — your access updates automatically."
  }
}
```

No migration — same row, same RLS, same admin-only writes.

## Files

**Edited**
- `src/hooks/useCheckoutConfig.ts` — Add `CheckoutHeader` type + `header` field on `CheckoutConfig`. Add `DEFAULT_CHECKOUT_HEADER` with current copy as fallback. Update `parse()` to read `header.title` / `header.description` (falling back to defaults when missing/blank).
- `src/components/admin/CheckoutLinksTab.tsx` — Add a "Modal Header" card at the top with a Title `Input` and a Description `Textarea`, bound to `draft.header`.
- `src/components/billing/UpgradeModal.tsx` — Replace the hardcoded `<DialogTitle>` / `<DialogDescription>` strings with `config.header.title` / `config.header.description`.

**Untouched** — Checkout slots, public funnel, webhook, subscription logic.
