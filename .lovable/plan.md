

# Strategies Tab Enhancements: Bulk Select, CSV Import/Export, Master Toggle

## Overview
Four enhancements to the Strategies tab, built incrementally so you can test each one before moving to the next.

---

## Feature 1: Multi-Select with Bulk Delete

- Checkbox column added to the left of every row in the strategies table
- "Select All" checkbox in the header toggles all rows
- When rows are selected, a toolbar appears: "{N} selected -- Delete Selected"
- Delete triggers a confirmation dialog, then removes all selected strategies

**Changes:**
- `useAdminStrategies.ts` -- add `useDeleteStrategies()` mutation (deletes via `.in('id', ids)`)
- `AdminPanel.tsx` -- add `selectedIds` state, checkbox column, bulk toolbar

---

## Feature 2: CSV Export

- "Export CSV" button in the toolbar downloads all strategies (or only selected ones) as a `.csv` file
- CSV columns: `id, name, description, horseman_type, difficulty, estimated_impact, tax_return_line_or_area, financial_goals, strategy_summary, sort_order, is_active`
- `financial_goals` (array field) serialized as semicolon-separated values within the CSV cell (e.g. `Reduce taxes;Maximize deductions`)
- Uses `Blob` + anchor click to trigger download

---

## Feature 3: CSV Import

- "Import CSV" button opens a file picker accepting `.csv` files
- Parses CSV rows, maps columns back to strategy fields
- `financial_goals` column split on semicolons back into an array
- Upserts all parsed strategies (inserts new, updates existing by ID)
- Shows toast with count of imported strategies or validation errors

**Changes:**
- `useAdminStrategies.ts` -- add `useImportStrategies()` mutation using `.upsert()`
- `AdminPanel.tsx` -- add hidden file input, parse CSV, call mutation
- CSV parsing done with a small helper function (no external library needed -- standard comma-delimited with quoted field support)

---

## Feature 4: Master Active Toggle

- A switch labeled "All Active" in the toolbar next to the Add Strategy button
- ON = sets all strategies to `is_active = true`; OFF = sets all to `false`
- Shows indeterminate state when mix of active/inactive

**Changes:**
- `useAdminStrategies.ts` -- add `useBulkToggleActive()` mutation
- `AdminPanel.tsx` -- add Switch with computed state from current data

---

## Technical Details

### Files Modified
- **`src/hooks/useAdminStrategies.ts`** -- 3 new hooks: `useDeleteStrategies`, `useImportStrategies`, `useBulkToggleActive`
- **`src/pages/AdminPanel.tsx`** -- selection state, checkbox column, bulk action toolbar, CSV export/import buttons, master active switch

### CSV Format Example
```text
id,name,description,horseman_type,difficulty,estimated_impact,tax_return_line_or_area,financial_goals,strategy_summary,sort_order,is_active
T-1,HSA Strategy,Use HSA for triple tax benefit,taxes,easy,$1000-3000/yr,Schedule A,"Reduce taxes;Maximize deductions",Leverage HSA contributions,1,true
```

### No Database Changes Needed
All operations use existing admin RLS policies on `strategy_definitions`.

### Build Order
Each feature ships independently -- after each one you say "yes" and I build the next:
1. Multi-select + bulk delete
2. CSV Export
3. CSV Import
4. Master Active toggle
