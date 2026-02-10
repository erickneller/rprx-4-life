
# Redirect New Users to Profile and Fix Company Field

## Overview
Two changes: (1) after a new user signs up and confirms their email, redirect them to the Profile page instead of the Dashboard, and (2) ensure the Company field is hidden from the profile page consistently (it was already hidden in the last edit but we need to verify the full flow).

## What Changes

### 1. New User Redirect to Profile
Currently, when a user signs up and logs in, `Auth.tsx` redirects to `/` which then bounces to `/dashboard`. Instead, new users (those with an incomplete profile) should be sent to `/profile` to complete their information first.

The approach:
- In `Auth.tsx`, after login/signup, redirect to `/` as before (this is fine for returning users)
- In `Index.tsx` (the `/` route), check if the logged-in user has a complete profile. If not, redirect to `/profile` instead of `/dashboard`
- "Complete" means the required fields are filled: `full_name`, `phone`, `monthly_income`, `monthly_debt_payments`, `monthly_housing`, `monthly_insurance`, `monthly_living_expenses`, `profile_type`, and `financial_goals`

### 2. Profile Completeness Check
Add a helper function (or inline check) in `useProfile` to expose an `isProfileComplete` flag. This checks whether all required fields have values.

### 3. Company Field
The Company field was already removed from the Profile page UI in the last edit. The screenshot appears to show a cached or stale version. No additional code change needed for the company field on the full profile page -- it is already hidden.

## Technical Details

### File: `src/hooks/useProfile.ts`
- Add a computed `isProfileComplete` boolean to the hook return value
- Checks: `full_name`, `phone`, `monthly_income`, `monthly_debt_payments`, `monthly_housing`, `monthly_insurance`, `monthly_living_expenses`, `profile_type`, and `financial_goals` (length > 0)

### File: `src/pages/Index.tsx`
- Import and use `useProfile`
- If user is authenticated but profile is incomplete, redirect to `/profile` instead of `/dashboard`
- Show loading spinner while profile is loading

### File: `src/pages/Profile.tsx`
- No changes needed -- Company field is already hidden

## Flow After Changes

```text
New User Signs Up
  -> Confirms email -> Logs in
  -> Auth.tsx redirects to /
  -> Index.tsx checks profile completeness
  -> Profile incomplete -> Redirect to /profile
  -> User completes profile -> Saves
  -> Next visit: Index.tsx sees complete profile -> Redirect to /dashboard
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProfile.ts` | Add `isProfileComplete` computed property |
| `src/pages/Index.tsx` | Check profile completeness before redirecting authenticated users |
