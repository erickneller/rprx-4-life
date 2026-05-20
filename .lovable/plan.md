# Admin-controlled Profile Field Visibility & Required-ness

## Goal
Let admins decide, per profile field, whether it is **Shown** to the user and whether it is **Required**. Hidden fields are automatically not required. Applies to both the **Profile page** (`/profile`) and the **Profile Wizard** (`/wizard`).

## Approach
A single config table drives visibility/required for every known profile field. The Profile page and Wizard read that config and:
- Hide rows where `visible = false`.
- Skip empty validations where `required = false` (and skip them entirely if hidden).
- Hide whole steps in the wizard if every field in that step is hidden.

Field labels stay hardcoded in the components — admin only toggles visibility/required, no copy editing here (that already lives in `wizard_content`).

## Database
New table `profile_field_settings`:
- `field_key` (text, PK) — e.g. `phone`, `monthly_income`, `filing_status`, `health_insurance`, `stress_money_worry`, `profile_type`, `financial_goals`, `tax_advantaged_accounts`, `children_ages`, etc.
- `label` (text) — display name in admin UI.
- `group` (text) — `basic | cashflow | household | goals | tax | insurance | stress | retirement` (drives wizard step grouping & admin sectioning).
- `visible` (bool, default true)
- `required` (bool, default false)
- `sort_order` (int)
- timestamps

RLS:
- `SELECT` for `authenticated` (everyone needs to read config to render the form).
- `INSERT/UPDATE/DELETE` only when `has_role(auth.uid(), 'admin')`.

Seeded with the full current field list from `ProfileWizard.tsx` + `Profile.tsx`.

## Edge / hooks
- New `src/hooks/useProfileFieldSettings.ts` — fetches and caches the table; exposes `isVisible(key)`, `isRequired(key)`, `bySection(group)`.
- A small util `validateProfileForm(form, settings)` used by both Profile page and Wizard to centralize the required-check.

## Admin UI
New tab in `AdminPanel` → **"Profile Fields"** (`src/components/admin/ProfileFieldsTab.tsx`):
- Grouped table (by `group`).
- Each row: label, field_key (code), two switches: **Show** and **Required** (Required auto-disabled & forced off when Show is off).
- "Reset to defaults" button.
- Saves inline; toast on success.

## Component changes
- `src/pages/Profile.tsx` — wrap each field/section in `{isVisible('field_key') && ...}`; replace hardcoded required checks with `isRequired('field_key')`-driven validation.
- `src/components/wizard/ProfileWizard.tsx` — same; additionally, if a step's fields are all hidden, auto-skip that step (and adjust the progress denominator).
- Keep the four globally-mandatory identity fields (`full_name`, `email`, `phone` when registration requires it) configurable but warn the admin in the UI before turning them off — these can break account creation flows.

## Out of scope
- Custom/new fields (only toggles existing ones).
- Per-company overrides.
- Editing field labels/help text (already in `wizard_content`).
- Conditional logic ("show field X only if Y=…").

## Verification
- Toggle `monthly_insurance` off → field disappears in both Profile and Wizard, no validation error if blank.
- Toggle `filing_status` required → blank submission shows error on both pages.
- Hide all fields in the "Retirement" step → that step is skipped in the wizard and the section is gone from Profile.
- Non-admin cannot mutate the table (RLS).

Reply **approve** to build, or tell me anything to tweak (e.g., add per-company overrides).
