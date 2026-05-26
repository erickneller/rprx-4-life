# Make Support Contact Accept Any Link

The "Support email" field on the Billing Card admin is currently treated as a `mailto:` target. The user has already pasted a URL (`https://app.rprx4life.com/help`) into it, so the existing card produces broken `mailto:https://...` links. Generalize it to accept any link.

## Changes

### `src/components/admin/FeaturesTab.tsx`
- Rename label "Support email" → **"Support link or email"**.
- Change input `type="email"` → `type="text"` with placeholder `https://... or support@example.com`.
- Update the helper text under footer note: "Use `{email}` (or `{link}`) to insert the support link as a clickable button."

### `src/hooks/useBillingCardSettings.ts`
- Add new field `supportUrl: string` to `BillingCardCopy` (kept alongside `supportEmail` for backwards compat).
- Actually: simpler — keep the field name `supportEmail` to avoid migration, but treat its value as a generic contact target. No type change needed; just relax intent in the comment.

### `src/components/billing/BillingCard.tsx`
- Add a helper `buildContactHref(value)`:
  - If value starts with `http://`, `https://`, `tel:`, or `mailto:` → use as-is.
  - Else if it contains `@` and no spaces → `mailto:<value>`.
  - Else → use as-is (treat as a relative URL like `/help`).
- Replace both hardcoded `mailto:${copy.supportEmail}` usages with `buildContactHref(copy.supportEmail)`.
- For external URLs add `target="_blank" rel="noopener noreferrer"`; skip for mailto/tel.
- Keep the existing "Mail" icon, OR swap to `LifeBuoy` / `ExternalLink` when the target is a URL — small UX polish, optional.
- The inline footer link text currently prints `copy.supportEmail` verbatim. That's fine for both an email address and a URL, so no change to the rendered label.

## Out of scope
- No DB migration. Existing stored values keep working; URLs that were already saved (like the user's current `https://app.rprx4life.com/help`) will start producing real links immediately.
- The `{email}` placeholder token in the footer note stays as-is for backwards compat (it just inserts whatever the field contains).
