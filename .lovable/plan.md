## Goal

Give admins control over the "Billing & Subscription" card shown on `/profile`:
1. **Hide/show** the entire card from the Profile page.
2. **Edit its text content** (title, description, button labels, support email, footer note).

## Where it lives today

`src/components/billing/BillingCard.tsx` is rendered inside `src/pages/Profile.tsx`. All copy is hardcoded ("Billing & Subscription", "Manage your RPRx plan.", "Upgrade Plan" / "Change Plan", "Manage via Support", support email, footer note).

## Approach

Store both the visibility toggle and the editable copy in the existing `feature_flags` table (same pattern just used for First-Login Flow). One row, `flag_id = 'billing_card'`:
- `enabled` (bool) → show/hide on Profile
- `value` (text, JSON) → editable copy fields

### 1. DB migration
Insert default row into `feature_flags`:
- `flag_id = 'billing_card'`
- `enabled = true`
- `value = '{"title":"Billing & Subscription","description":"Manage your RPRx plan.","upgradeLabel":"Upgrade Plan","changeLabel":"Change Plan","supportLabel":"Manage via Support","supportEmail":"support@rprx4life.com","footerNote":"To cancel or change payment method, email {email}."}'`

### 2. New hook `src/hooks/useBillingCardSettings.ts`
- `useBillingCardSettings()` → `useQuery` reads `enabled` + parsed `value` JSON, returns `{ enabled, copy }` with safe fallbacks to current hardcoded strings.
- `useSetBillingCardSettings()` → `useMutation` to update either `enabled` or `value` (stringified JSON) + `updated_at`, then invalidate.

### 3. Update `src/components/billing/BillingCard.tsx`
- Consume `useBillingCardSettings()`; use `copy.*` for every hardcoded string.
- Footer note supports `{email}` placeholder.
- (Visibility is enforced by the parent, not by the card itself, so the card stays generic.)

### 4. Update `src/pages/Profile.tsx`
- Read `enabled` from the hook; render `<BillingCard />` only when `enabled === true` (default true while loading to avoid flicker).

### 5. Admin UI — extend `src/components/admin/FeaturesTab.tsx`
Add a "Billing Card (Profile)" card with:
- A Switch for show/hide.
- Inputs for: title, description, upgrade label, change label, support button label, support email, footer note (textarea, with helper text noting `{email}` placeholder).
- "Save changes" button → calls `useSetBillingCardSettings()` with the JSON blob.

## Out of scope
- Per-user or per-company overrides.
- Hiding the card from other surfaces (it's currently only used on Profile).
- Changing billing logic, tier behavior, or upgrade flow.

## Files touched
- new: `supabase/migrations/<ts>_billing_card_flag.sql`
- new: `src/hooks/useBillingCardSettings.ts`
- edit: `src/components/billing/BillingCard.tsx`
- edit: `src/pages/Profile.tsx`
- edit: `src/components/admin/FeaturesTab.tsx`
