# Expanded GHL Profile Sync — DB-Driven Field Mapping

Build a configurable mapping layer so admins can decide which `profiles` columns push to GoHighLevel (as standard contact fields, custom fields, or tags), with auto-sync on every relevant profile change.

## 1. New table: `ghl_field_mappings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `profile_field` | text | e.g. `full_name`, `email`, `phone`, `company`, `monthly_income`, `rprx_score_total`, `primary_horseman` |
| `ghl_target_type` | text | `standard` \| `custom_field` \| `tag` |
| `ghl_field_key` | text | For `standard`: `firstName`/`lastName`/`email`/`phone`/`companyName`/`address1`/`city`/`state`/`postalCode`/`country`. For `custom_field`: the GHL custom field **key** or **id**. For `tag`: a tag template like `horseman:{value}`. |
| `transform` | text | Optional: `none`, `split_first_name`, `split_last_name`, `join_comma`, `boolean_yesno`, `number`, `lowercase` |
| `is_active` | boolean | default true |
| `sort_order` | int | |
| `notes` | text | Admin description |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** admins manage; authenticated read (so the edge function can fetch with the user's JWT, or service-role read in the function).

**Seeded mapping** (defaults — admin can edit):

| Profile field | GHL target | Key | Transform |
|---|---|---|---|
| full_name | standard | firstName | split_first_name |
| full_name | standard | lastName | split_last_name |
| email (auth) | standard | email | none |
| phone | standard | phone | none |
| company | standard | companyName | none |
| profile_type | custom_field | rprx_persona | join_comma |
| filing_status | custom_field | rprx_filing_status | none |
| financial_goals | custom_field | rprx_goals | join_comma |
| monthly_income | custom_field | rprx_monthly_income | number |
| monthly_debt_payments | custom_field | rprx_monthly_debt | number |
| emergency_fund_balance | custom_field | rprx_emergency_fund | number |
| rprx_score_total | custom_field | rprx_score | number |
| rprx_grade | custom_field | rprx_grade | none |
| rprx_score_river | custom_field | rprx_pillar_river | number |
| rprx_score_lake | custom_field | rprx_pillar_lake | number |
| rprx_score_rainbow | custom_field | rprx_pillar_rainbow | number |
| rprx_score_tax | custom_field | rprx_pillar_tax | number |
| rprx_score_stress | custom_field | rprx_pillar_stress | number |
| current_tier | custom_field | rprx_tier | none |
| current_streak | custom_field | rprx_streak | number |
| total_points_earned | custom_field | rprx_xp | number |
| onboarding_completed | custom_field | rprx_onboarding_done | boolean_yesno |
| estimated_annual_leak_low | custom_field | rprx_leak_low | number |
| estimated_annual_leak_high | custom_field | rprx_leak_high | number |
| primary_horseman (from latest assessment) | tag | `horseman:{value}` | lowercase |

(Insurance flags, retirement fields, stress answers can be added by the admin later via the UI.)

## 2. Edge function `ghl-sync` — generalized

Rewrite to:

1. Load the user's full `profiles` row + `auth.users.email`.
2. Pull the latest `primary_horseman` from `user_assessments` / `assessment_submissions` (used for tag mapping).
3. Fetch active rows from `ghl_field_mappings`.
4. Build the GHL `/contacts/upsert` payload:
   - Standard fields → top-level keys
   - Custom fields → `customFields: [{ key, field_value }]`
   - Tags → `tags: [...]`
5. Apply `transform` per row (split, join_comma, boolean_yesno, number, lowercase).
6. Upsert, store `ghl_contact_id` back on profile (unchanged behavior).
7. Accept an optional `{ fields: [...] }` body so callers can pass only what changed (function still fetches the row to fill mapped values; minimizes payload, not queries).

Keep existing `source: "ghl-webhook"` short-circuit to prevent loops.

## 3. Auto-sync trigger surface

Add a small client helper `syncProfileToGHL(changedKeys)` and invoke it from:

- `useProfile.ts` — already calls on insert + on contact-field updates. Expand to call on **any** update where a changed key intersects the active mapping list (fetched once via React Query).
- `useRPRxScore.ts` — after score recalculation persists.
- Assessment completion flow (after `submit-health-assessment` + after `user_assessments` insert) — to push horseman tag and refreshed scores.

The helper just calls `supabase.functions.invoke('ghl-sync', { body: { changedKeys } })` — the function itself reads fresh values from the DB, so we never trust client values.

## 4. Admin UI: "GHL Field Mapping" tab

New tab in `AdminPanel` (sibling of `FeaturesTab`):

- Table of mappings with inline edit:
  - Profile field (dropdown of known profile columns + a few derived: `email`, `primary_horseman`, `latest_assessment_tier`)
  - Target type (Standard / Custom field / Tag)
  - GHL key/template
  - Transform (dropdown)
  - Active toggle, sort order
- Add row / Delete row
- "Test sync for me" button → calls `ghl-sync` for the admin's own user and shows the resulting payload + GHL response (read-only preview).
- Reference panel listing the available GHL standard field keys and a link to the GHL custom-fields setup page.

## 5. Out of scope

- Webhook (`ghl-webhook`) reverse mapping stays as-is for now (can be made DB-driven in a follow-up).
- No bulk backfill job in this iteration; existing users re-sync the next time their profile changes. Admin "Test sync" button doubles as a manual re-sync.

## Technical details

- Migration creates `ghl_field_mappings`, RLS (`Admins manage`, `authenticated read`), `update_updated_at_column` trigger, and seeds the default rows above.
- Edge function uses the service role to read profiles/assessments (current pattern), but still validates the JWT for the calling user's id.
- GHL `/contacts/upsert` accepts `customFields` as an array of `{ id?, key?, field_value }`. We pass `key` so admin-entered keys work without needing the GHL field UUIDs (GHL resolves by key when configured).
- TS: cast `.from('ghl_field_mappings')` to `any` per the project's deep-type constraint until types regenerate.
