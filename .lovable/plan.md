## Goal
Let admins select multiple users in the Users tab and delete them in one action, with a single confirmation dialog.

## UX
- New leftmost column in the Users table with a checkbox per row.
- Header checkbox: select all / none of the **currently filtered** rows (tri-state when partially selected).
- When 1+ rows are selected, a sticky action bar appears above the table:
  - `N selected` · `Clear` · `Delete selected` (destructive button).
- Clicking **Delete selected** opens an `AlertDialog`:
  - "Delete N users? This permanently removes their accounts and data. Cannot be undone."
  - Confirm runs the bulk delete; cancel closes.
- The current admin's own row checkbox is disabled (can't self-delete, matches the edge function guard).
- Selection clears after a successful delete or when filters change.
- Existing per-row Delete action stays as-is.

## Behavior
- Toast on success: `Deleted X users` (and `Y failed` if partial).
- Selection state is local to `UsersTab`, keyed by user id (`Set<string>`).
- React Query `admin-users` list is invalidated after the bulk delete.

## Technical changes

**`supabase/functions/admin-user-actions/index.ts`**
- Add new action `bulk-delete-users` accepting `{ userIds: string[] }`.
- Reuses existing admin auth + role check.
- Filters out the caller's own id before deleting.
- Iterates `serviceClient.auth.admin.deleteUser(id)` and returns `{ success: true, deleted: number, failed: Array<{ userId, error }> }`.
- Keep the existing single-user `delete-user` branch untouched (still used by per-row action and the loop is replaced by the new branch for bulk).

**`src/components/admin/UsersTab.tsx`**
- Add `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`.
- Add `<Checkbox>` header + cell (import from `@/components/ui/checkbox`).
- Header checkbox computes checked/indeterminate from filtered rows.
- Add `BulkActionBar` section (inline JSX) shown when `selectedIds.size > 0`.
- Add `bulkDeleteOpen` state + `AlertDialog` for confirmation.
- `handleBulkDelete`: call `adminAction.mutateAsync({ action: 'bulk-delete-users', userIds: [...selectedIds] })`, toast, clear selection, invalidate query.
- Disable checkbox for the row where `user.id === currentUser.id`.
- Reset `selectedIds` in a `useEffect` when the filter/search inputs change.

**`useAdminUserActions` hook (or wherever `adminAction` lives)**
- Extend the mutation payload type to include the optional `userIds: string[]` field. No new hook needed.

## Out of scope
- Bulk ban / bulk role change (only delete per the request).
- Server-side pagination changes.
