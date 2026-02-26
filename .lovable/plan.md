

# Enhanced Admin User Management

## Overview

Upgrade the Admin Panel's Users tab from a basic list to a full user management system with detailed user profiles, password reset, account locking, and user deletion.

## Current State

The Users tab currently shows: email, join date, admin role toggle, and tier toggle. The `admin_list_users()` SQL function only returns `id`, `email`, and `created_at` from `auth.users`.

## Changes Required

### 1. Database: Expand `admin_list_users` function

Replace the existing function to return more user data:
- `id`, `email`, `created_at`, `last_sign_in_at`, `email_confirmed_at`
- `banned_until` (Supabase's built-in user banning field)
- `raw_user_meta_data` (contains full_name from signup)

This stays as a `SECURITY DEFINER` function so only admins can call it, and it safely reads from `auth.users`.

### 2. Database: Create admin edge functions for privileged operations

Three operations require the Supabase **service role key** (not the anon key), so they must be edge functions:

**Edge Function: `admin-user-actions`**
Handles three actions via a POST body `{ action, userId }`:

- **`reset-password`**: Calls `supabase.auth.admin.generateLink({ type: 'recovery', email })` and returns the reset link, OR uses `resetPasswordForEmail` to send the email directly. The admin can then share the link or trigger the email.
- **`ban-user`**: Calls `supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' | '876000h' })` to lock/unlock accounts. Supabase uses `banned_until` internally.
- **`delete-user`**: Calls `supabase.auth.admin.deleteUser(userId)`. This cascades to delete the profile and all related data.

The edge function validates that the calling user is an admin using the `has_role` check before performing any action.

### 3. Frontend: New `UsersTab` component

Extract the Users tab into its own component file `src/components/admin/UsersTab.tsx` for cleanliness. Features:

**User list table columns:**
- Full Name (from profile or user metadata)
- Email
- Phone (from profile)
- Joined date
- Last sign-in
- Status (Active / Locked / Unconfirmed)
- Role (Admin badge)
- Tier (Free/Paid toggle)
- Actions dropdown

**Expandable row or detail dialog:**
Clicking a user row opens a detail dialog showing:
- All profile fields: income, debt payments, housing, insurance, living expenses, emergency fund, filing status, insurance coverage, financial goals, stress indicators, scores, tier, gamification stats
- Assessment count and last assessment date
- Plan count

**Actions dropdown per user:**
- Toggle Admin role (existing)
- Toggle Tier (existing)
- Send Password Reset Email -- calls the edge function, shows confirmation toast
- Lock/Unlock Account -- calls the edge function, toggles `banned_until`, shows confirmation
- Delete User -- shows a destructive confirmation dialog ("This will permanently delete the user and all their data"), calls the edge function

**Search/filter bar:**
- Text search filtering by name or email
- Filter by status (All / Active / Locked)
- Filter by tier (All / Free / Paid)

### 4. Update `admin_list_users` to include profile data via JOIN

Instead of making separate queries, update the SQL function to JOIN profiles:

```text
SELECT au.id, au.email, au.created_at, au.last_sign_in_at,
       au.banned_until, au.raw_user_meta_data,
       p.full_name, p.phone, p.monthly_income, p.filing_status,
       p.onboarding_completed, p.rprx_score_total, p.current_tier,
       p.total_points_earned, p.current_streak
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
```

## File Summary

| File | Action |
|------|--------|
| Migration SQL | Alter -- replace `admin_list_users` function with expanded version |
| `supabase/functions/admin-user-actions/index.ts` | New -- edge function for reset password, ban, delete |
| `src/components/admin/UsersTab.tsx` | New -- extracted and expanded Users tab component |
| `src/pages/AdminPanel.tsx` | Edit -- import `UsersTab`, replace inline users tab content |

## Security

- The edge function validates admin role server-side before any action
- The `admin_list_users` function remains `SECURITY DEFINER` so it can read `auth.users`
- Delete and ban operations use the service role key only inside the edge function
- The admin cannot delete or ban themselves (guard in edge function)
- Confirmation dialogs prevent accidental destructive actions

## Technical Notes

- Supabase's `banned_until` field is the built-in mechanism for locking users. Setting it to a far-future date effectively locks the account. Setting it to `null` unlocks it.
- Password reset sends a standard Supabase recovery email to the user -- the admin does not see or set the new password.
- User deletion cascades via the `ON DELETE CASCADE` foreign key on `profiles.id -> auth.users.id` (if configured), plus RLS-protected child tables.

