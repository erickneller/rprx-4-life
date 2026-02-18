

# CSV Import Error Reporting + Sortable Strategy Table

## Overview
Two enhancements to the admin Strategies tab:
1. Detailed error reporting when CSV import rows fail validation or database insert
2. Clickable column headers to sort strategies by any field

---

## Feature 1: CSV Import Error Report

Currently the import silently skips rows that fail validation (missing id/name) and if the upsert fails, the entire batch errors. This needs to change to row-by-row validation with a detailed error report.

### How it works:
- Before sending to Supabase, validate each row individually:
  - Required fields present: `id`, `name`, `description`, `horseman_type`, `difficulty`
  - `horseman_type` is one of: interest, taxes, insurance, education
  - `difficulty` is one of: easy, moderate, advanced
  - No duplicate IDs within the CSV
- Split rows into "valid" and "invalid" buckets
- Upsert only the valid rows
- If valid rows also fail at the database level, catch and add to errors
- Show a summary toast: "Imported 85 of 100 strategies. 15 had errors."
- If any errors exist, open a dialog showing an error table:
  - Row number | ID | Field | Error message
- User can review, fix their CSV, and re-import

### Changes:
- **`src/pages/AdminPanel.tsx`**:
  - Add `importErrors` state: `Array<{ row: number; id: string; field: string; message: string }>`
  - Add `importErrorsOpen` dialog state
  - Rewrite `handleImportCSV` to validate row-by-row, collect errors, upsert valid rows only
  - Add an `ImportErrorsDialog` showing the error table
  - If DB upsert fails, attempt individual upserts to isolate which rows fail

---

## Feature 2: Sortable Column Headers

### How it works:
- Add `sortField` and `sortDirection` state (`'asc' | 'desc'`)
- Clicking a column header sets it as the sort field; clicking again toggles direction
- Sort indicator arrow shown next to active column header
- Sortable columns: ID, Name, Horseman, Difficulty, Tax Line/Area, Sort Order, Active
- Sorting is client-side on the already-fetched data

### Changes:
- **`src/pages/AdminPanel.tsx`**:
  - Add `sortField` state (default: `'horseman_type'`) and `sortDir` state (default: `'asc'`)
  - Create `sortedStrategies` computed array using `useMemo` or inline sort
  - Replace `strategies.map(...)` with `sortedStrategies.map(...)`
  - Make each `TableHead` clickable with an arrow indicator (using `ArrowUpDown` or `ChevronUp`/`ChevronDown` from lucide)
  - Select all checkbox operates on sorted/displayed list

---

## Technical Details

### Files Modified
- **`src/pages/AdminPanel.tsx`** -- import error dialog, validation logic, sortable headers

### No Database Changes Needed

### Validation Rules for Import
| Field | Rule | Error Message |
|-------|------|---------------|
| id | Non-empty | "ID is required" |
| name | Non-empty | "Name is required" |
| description | Non-empty | "Description is required" |
| horseman_type | Must be interest/taxes/insurance/education | "Invalid horseman type: [value]" |
| difficulty | Must be easy/moderate/advanced | "Invalid difficulty: [value]" |
| id (duplicate) | No duplicate IDs in CSV | "Duplicate ID in CSV" |

