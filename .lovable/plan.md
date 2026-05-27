## Profile Download / Print

Add a way for users to export the answers shown on their Profile page, respecting admin field visibility settings.

### UI

- Add a "Download" dropdown button in the Profile page header (top right, near the page title), styled like the existing `PlanDownload` dropdown:
  - **Print / Save as PDF** — opens browser print dialog (`window.print()`), using a print-only stylesheet for clean output.
  - **Download as PDF** — generates a PDF directly via `jsPDF` (already used by `planExport.ts` / `resultsPdfExport.ts`).
  - **Download as CSV** — two-column "Field, Value" export for spreadsheet use.

### What gets included

- Iterate the same fields the Profile page renders, gated by `useProfileFieldSettings().isVisible(field_key)` so admin-hidden fields are excluded.
- Sections mirror the on-screen layout: Account info, Cash flow, Household, Goals & filing, Retirement, Insurance coverage, Emergency fund / employer match / tax-advantaged accounts, Stress questions, Company (if any).
- Labels and human-readable values reuse the existing option arrays (`PROFILE_TYPES`, `FINANCIAL_GOALS`, `FILING_STATUSES`, `EMPLOYER_MATCH_OPTIONS`, etc.) so the export matches what the user sees, not raw enum keys.
- Header on every export: user name, email, generation date, "RPRx For Life — Profile Summary".
- Footer disclaimer matching other exports ("Educational use only. Not financial advice.").

### Files

- **New** `src/lib/profileExport.ts` — pure functions:
  - `buildProfileExportRows(profile, isVisible)` → ordered `[{ section, label, value }]`
  - `exportProfileAsPDF(rows, user)` (jsPDF)
  - `exportProfileAsCSV(rows, user)` (download blob)
  - `formatProfileValue(...)` helpers for currency / arrays / enums.
- **New** `src/components/profile/ProfileDownload.tsx` — dropdown button (mirrors `PlanDownload.tsx`).
- **Edit** `src/pages/Profile.tsx`:
  - Render `<ProfileDownload />` in the page header.
  - Add `print:hidden` to interactive controls (save bar, avatar upload buttons, invite card actions) and a minimal `print:block` header so `window.print()` produces a clean printout.

### Notes

- No DB changes. No new dependencies (jsPDF already installed).
- Visibility logic is centralized in `useProfileFieldSettings` and applied once in `buildProfileExportRows`, so future admin-hidden fields are automatically excluded from exports.
- Empty/null fields are skipped from the export to avoid noise.
