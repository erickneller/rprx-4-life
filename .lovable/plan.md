

# Fix: Company Creation Display & Invite Link Join Flow

## Problems Found

### 1. Invite link join fails (critical)
In `src/hooks/useCompany.ts`, the `joinByToken` mutation (line 92-96) still queries the `companies` table directly:
```ts
.from('companies').select('*').eq('invite_token', token).maybeSingle()
```
Since we dropped the `companies_public_read` RLS policy, non-member authenticated users can't read the companies table — so this query returns `null`, and the join fails with "Invalid or expired invite link."

### 2. Admin CompaniesTab not refreshing after creation
The admin `createMutation` in `CompaniesTab.tsx` (line 80-84) inserts a company without `owner_id`, which succeeds. But the subsequent refetch should work via the "Admins have full access" policy. The likely cause is that the refetch query is silently erroring — possibly because the `select` includes `invite_token` but the query fires before invalidation completes. Adding error logging will help, but the primary fix is ensuring the query is robust.

## Solution

### 1. Fix `joinByToken` in `useCompany.ts`
Replace the direct table query with the `lookup_company_by_invite_token` RPC to get the company ID, then proceed with the member insert:

```ts
// Before (broken):
const { data: company } = await supabase.from('companies').select('*').eq('invite_token', token)

// After (fixed):
const { data: rpcResult } = await supabase.rpc('lookup_company_by_invite_token', { _token: token });
const match = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
if (!match) throw new Error('Invalid or expired invite link.');
// Use match.id for the company_members insert
```

### 2. Fix admin CompaniesTab query resilience
Add error handling to the member counts sub-query and ensure the main query error is surfaced. The admin panel's direct `invite_token` select is fine since the ALL policy grants full access.

## Files

| Action | File |
|--------|------|
| Modified | `src/hooks/useCompany.ts` — fix `joinByToken` to use RPC instead of direct table query |
| Modified | `src/components/admin/CompaniesTab.tsx` — add error handling to query |

