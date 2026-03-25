

# Fix: Restrict Company Invite Token Visibility

## The Problem
RLS operates at the row level, not column level. The "Members can view their company" SELECT policy returns all columns including `invite_token` to every member. Regular members can extract the token and share it without owner/admin approval.

## Solution

Since Postgres RLS cannot mask individual columns, we need a two-part fix:

### 1. Create a Security Definer RPC for Invite Token Access

**Migration:** Create `get_company_invite_token(_company_id uuid)` that returns the token only if the caller is an owner/admin of that company (or a platform admin).

```sql
CREATE OR REPLACE FUNCTION public.get_company_invite_token(_company_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.invite_token::text
  FROM public.companies c
  WHERE c.id = _company_id
    AND (
      c.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = _company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'
      )
    )
  LIMIT 1;
$$;
```

### 2. Stop Selecting invite_token in useCompany Hook

**Modified: `src/hooks/useCompany.ts`**

Change `select('*')` on the companies table to explicitly list columns **without** `invite_token`:
```
.select('id, name, slug, owner_id, ghl_location_id, plan, created_at, updated_at')
```

Remove `invite_token` from the `Company` interface (or make it optional). Add a separate `useCompanyInviteToken(companyId)` query that calls the RPC.

### 3. Update Profile Page — Only Show Invite Link for Owners/Admins

**Modified: `src/pages/Profile.tsx`**

- Check `membership.role` — only render the invite link section when role is `'owner'` or `'admin'`
- Fetch the token via the new RPC instead of reading it from the company object

### 4. Admin CompaniesTab Already Safe

The admin panel's `CompaniesTab` selects `invite_token` directly, but it's protected by the "Admins have full access" RLS policy which only applies to platform admins. No change needed.

## Files

| Action | File |
|--------|------|
| Migration | Create `get_company_invite_token` RPC |
| Modified | `src/hooks/useCompany.ts` — stop selecting invite_token, add invite token hook |
| Modified | `src/pages/Profile.tsx` — gate invite link to owner/admin, use RPC |

