

# Fix: Restrict Company Invite Token Visibility

## Status: ✅ Complete

## Changes Made

### 1. Migration — `get_company_invite_token` RPC
Created a `SECURITY DEFINER` function that returns the invite token only if the caller is:
- The company owner (`owner_id`)
- A company-level admin/owner (via `company_members`)
- A platform admin (via `user_roles`)

### 2. `src/hooks/useCompany.ts`
- Removed `invite_token` from the `Company` interface
- Changed `select('*')` to explicit column list excluding `invite_token`
- Added `useCompanyInviteToken(companyId)` hook that calls the new RPC

### 3. `src/pages/Profile.tsx`
- Company card now shown for both `owner` and `admin` roles (not just owner)
- Invite link fetched via `useCompanyInviteToken` RPC instead of reading from company object
- Extracted `CompanyInviteCard` sub-component for cleaner separation

### 4. Admin `CompaniesTab` — No change needed
Already protected by "Admins have full access" RLS policy.
