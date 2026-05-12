## Goal
Add a "Download GHL Field Spec" button on the GHL Field Mapping admin tab that exports a file containing every custom field (and tag template) the user must create in GoHighLevel for the sync to work.

## Where it lives
`src/components/admin/GHLFieldMappingTab.tsx` — add a button next to existing controls in the header.

## What gets downloaded
A CSV (primary) plus a human-readable Markdown setup guide, bundled into the same download via a dropdown (matches the pattern used by `PlanDownload.tsx`):

- **Download as CSV** — for bulk reference / sharing with a GHL admin
- **Download as Markdown** — step-by-step setup guide

### Source data
Pull from `ghl_field_mappings` where `is_active = true`, filtered to rows where `ghl_target_type` is `custom_field` or `tag` (standard fields like firstName/email don't need to be created in GHL).

### CSV columns
| Column | Source / Notes |
|---|---|
| Field Name (Label) | Humanized version of `ghl_field_key` (e.g. `rprx_score_total` → "RPRx Score Total") |
| Field Key | `ghl_field_key` exactly as the API expects it |
| GHL Object | Always "Contact" |
| Field Type | Inferred from `profile_field` data type + `transform`: `Number`, `Text`, `Single Line`, `Multi Line`, `Checkbox` (Yes/No), `Date`, `Dropdown`. See inference rules below. |
| Group | "RPRx Sync" (suggested folder/group in GHL) |
| Sample Value | Example produced by the transform (e.g. `boolean_yesno` → "Yes") |
| Source Profile Field | `profile_field` |
| Transform | `transform` |
| Notes | `notes` |
| Required for Sync | "Yes" if `is_active` |

For `tag` rows, list them in a separate section ("Tags to Pre-create") with the resolved tag template (e.g. `horseman_{value}` → "horseman_taxes", "horseman_interest", …).

### Field type inference rules
- `transform = boolean_yesno` → Checkbox / Yes-No
- `transform = number` OR `profile_field` matches `monthly_*|*_balance|*_score*|num_*|years_*|estimated_*` → Number
- `transform = join_comma` OR `profile_field` is array (`financial_goals`, `tax_advantaged_accounts`, `profile_type`) → Multi Line Text (comma-separated)
- `profile_field` ends in `_date` or is `last_active_date` → Date
- Everything else → Single Line Text

### Markdown guide format
```
# GoHighLevel Custom Field Setup

These fields must be created in **Settings → Custom Fields → Contact**
before the RPRx → GHL sync can write to them.

## Custom Fields (N total)

### 1. RPRx Score Total
- **Field Key:** `rprx_score_total`
- **Type:** Number
- **Group:** RPRx Sync
- **Sample:** 87
- **Notes:** Composite RPRx score (0–100)

…

## Tags Auto-Applied by Sync
- `horseman_{value}` — applied per primary horseman
- …
```

## Implementation

1. **New helper** `src/lib/ghlFieldSpecExport.ts`
   - `inferGhlFieldType(row)` → string
   - `humanizeKey(key)` → label
   - `buildSpecRows(mappings)` → array for CSV
   - `buildMarkdownSpec(mappings)` → string
   - `downloadGhlSpecCsv(mappings)` and `downloadGhlSpecMarkdown(mappings)` — reuse `downloadCSV` from `src/lib/csvExport.ts` and a small blob helper for `.md`.

2. **UI change** in `GHLFieldMappingTab.tsx`
   - Add a `DropdownMenu` "Download GHL Spec" button (shadcn, matching `PlanDownload.tsx`) in the tab header.
   - Disabled while mappings are loading or empty.
   - Toast on success.

3. **No backend changes** — pure read from existing `ghl_field_mappings` already loaded in the tab.

## Out of scope
- Creating fields in GHL via API (would require `customFields.write` scope; not requested).
- Standard fields (firstName, lastName, email, phone, companyName) — already built into GHL contacts.

## Verification
- Open Admin → GHL Field Mapping → click Download → CSV opens with one row per active custom field/tag and correct inferred types.
- Markdown variant renders cleanly in any markdown viewer.
