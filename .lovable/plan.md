

# Add Edit and Delete for Companies

## Overview
Add inline edit and delete actions to each company row in the admin Companies tab.

## Changes

**Modified: `src/components/admin/CompaniesTab.tsx`**

1. **Add an "Actions" column** with Edit (Pencil icon) and Delete (Trash icon) buttons per row.

2. **Edit Dialog** -- reuse a dialog similar to the create dialog, pre-populated with the selected company's name and plan. On save, runs an `update` mutation against the `companies` table for that row's `id`.

3. **Delete with confirmation** -- `confirm()` prompt, then runs a `delete` mutation against the `companies` table. Also deletes associated `company_members` rows first (or relies on cascade if configured). Since there's no FK cascade set up, the mutation will delete `company_members` for that company first, then delete the company.

4. **New state**: `editingCompany: CompanyRow | null` to track which company is being edited.

5. **New mutations**:
   - `updateMutation`: updates `name` and `plan` on `companies` table by `id`
   - `deleteMutation`: deletes from `company_members` where `company_id`, then deletes from `companies` where `id`

## Database
No migration needed -- the existing "Admins have full access to companies" and "Admins have full access to company_members" ALL policies already grant DELETE and UPDATE to platform admins.

## UI Layout
Each row gets two small icon buttons (Pencil, Trash) in a new "Actions" column at the end of the table, keeping the existing invite link column intact.

