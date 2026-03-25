

# Fix Build Errors

## Problem
Three categories of build errors:
1. **Edge functions** (`ghl-sync`, `ghl-webhook`, `admin-user-actions`): `err` is of type `unknown` — need to cast before accessing `.message`
2. **`useCompany.ts` and `CompaniesTab.tsx`**: Reference `companies` and `company_members` tables that don't exist in the Supabase type definitions — these tables need a database migration first, then a types regeneration
3. **`useProfile.ts`**: Type instantiation too deep when querying `companies`

## Plan

### 1. Fix edge function `err` typing (3 files)
In the catch blocks of `ghl-sync/index.ts`, `ghl-webhook/index.ts`, and `admin-user-actions/index.ts`, change:
```typescript
err.message
```
to:
```typescript
(err as Error).message
```

### 2. Create `companies` and `company_members` tables
Add a migration creating both tables with the schemas matching the TypeScript interfaces already defined in `useCompany.ts`:
- `companies`: id, name, slug, owner_id, ghl_location_id, plan, invite_token, created_at, updated_at
- `company_members`: id, company_id, user_id, role, invited_by, joined_at

Enable RLS on both tables with appropriate policies.

### 3. Regenerate Supabase types
After the migration deploys, regenerate `src/integrations/supabase/types.ts` so the new tables are recognized by the TypeScript client.

## Files to Modify
- `supabase/functions/ghl-sync/index.ts` — cast `err`
- `supabase/functions/ghl-webhook/index.ts` — cast `err`
- `supabase/functions/admin-user-actions/index.ts` — cast `err`
- New migration for `companies` + `company_members` tables
- `src/integrations/supabase/types.ts` — regenerate after migration

