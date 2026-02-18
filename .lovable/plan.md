

# Remove `strategy_summary` Field from Strategy Definitions

## Overview
The `strategy_summary` column is redundant -- consumer-facing components (like `StrategyActivationCard`) only use `description`. This cleanup removes the column from the database and all code references.

---

## Step 1: Database Migration

Drop the `strategy_summary` column from `strategy_definitions`:

```sql
ALTER TABLE strategy_definitions DROP COLUMN IF EXISTS strategy_summary;
```

No data migration needed since `description` already contains the user-facing text.

---

## Step 2: Code Cleanup

### `src/hooks/useAdminStrategies.ts`
- Remove `strategy_summary` from the `StrategyRow` interface
- Remove `strategy_summary` from the `StrategyInput` interface
- Remove `strategy_summary` mapping in `useCreateStrategy`, `useImportStrategies`

### `src/pages/AdminPanel.tsx`
- Remove `strategy_summary` from the default form state
- Remove the "Strategy Summary" column from the table header and row
- Remove the "Strategy Summary" textarea from the create/edit dialog
- Remove `strategy_summary` from CSV export headers and row serialization
- Remove `strategy_summary` parsing from CSV import logic

---

## What Stays
- The `description` field remains as-is -- no changes to its content or usage
- All other strategy fields (tax_return_line_or_area, financial_goals, etc.) are untouched

## Files Modified
- **Database migration** -- drop column
- **`src/hooks/useAdminStrategies.ts`** -- remove field from types and mutations
- **`src/pages/AdminPanel.tsx`** -- remove from table, form, and CSV logic

