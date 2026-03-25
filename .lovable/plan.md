

# Fix: Remove Public Read Access on Companies Table

## The Problem
The `companies_public_read` RLS policy uses `USING (true)` which exposes all company data (including `invite_token`, `ghl_location_id`, `owner_id`) to unauthenticated users. An attacker could enumerate all companies and their invite tokens.

## Why Public Read Exists
The `/join?token=...` page needs to look up a company by `invite_token` before the user has signed up. This is the only unauthenticated access needed.

## Solution

### 1. Create a Security Definer Function
Create `lookup_company_by_invite_token(token uuid)` that returns only `id` and `name` — no sensitive fields. This runs with elevated privileges, bypassing RLS.

```sql
CREATE OR REPLACE FUNCTION public.lookup_company_by_invite_token(_token uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.companies c
  WHERE c.invite_token = _token
  LIMIT 1;
$$;
```

### 2. Drop the Dangerous Policy

```sql
DROP POLICY "companies_public_read" ON public.companies;
```

The remaining policies already cover all legitimate access:
- **Members** can view their company (via `company_members` join)
- **Owners** can view their company (via `owner_id = auth.uid()`)
- **Admins** have full access (via `user_roles`)
- **Authenticated users** can create companies

### 3. Update `Join.tsx`
Replace the direct `supabase.from('companies').select(...)` call with `supabase.rpc('lookup_company_by_invite_token', { _token: token })`.

### 4. Update `useProfile.ts`
The pending invite token lookup also queries companies publicly — update it to use the same RPC function.

## Files

| Action | File |
|--------|------|
| Migration | Create RPC function + drop `companies_public_read` policy |
| Modified | `src/pages/Join.tsx` — use RPC instead of direct query |
| Modified | `src/hooks/useProfile.ts` — use RPC for pending token lookup |

