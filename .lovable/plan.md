## Fix

Align the admin "Create / Edit Company" plan dropdown with app-wide tiers: **Free / Partner / Pro** (no Enterprise).

### 1. Migration
- Update existing `companies` rows where `plan = 'enterprise'` → `'pro'`.
- No schema change (column is free-text).

### 2. `src/components/admin/CompaniesTab.tsx`
- Change types `'free' | 'pro' | 'enterprise'` → `'free' | 'partner' | 'pro'` (both `newPlan` and `editPlan`).
- Replace Enterprise `<option>` with Partner in both Create and Edit dialogs.
- Update the badge variant map in the table row: `pro` → default, `partner` → secondary, `free` → outline.

## Out of scope
- No change to user subscription tier logic.
- No change to company plan being a free-text column (still flexible).
