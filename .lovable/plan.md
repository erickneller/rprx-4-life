
# Fix: Always Redirected to Profile After Login

## Root Cause

A race condition between two separate `useAuth()` hook instances:

1. `Index.tsx` calls `useAuth()` -- gets `user` loaded, `loading: false`
2. `Index.tsx` calls `useProfile()` -- which internally calls its own `useAuth()`
3. The `useProfile` instance of `useAuth()` may not have resolved yet, so `user?.id` is still `undefined`
4. This means the React Query in `useProfile` has `enabled: false`, returning `isLoading: false` and `data: undefined`
5. `isProfileComplete` evaluates to `false` (because `profileQuery.data` is null)
6. Index immediately redirects to `/profile`

## Fix

**File: `src/pages/Index.tsx`**

Pass the authenticated user's ID into `useProfile` so it doesn't rely on its own separate `useAuth()` timing. Alternatively (and more simply), add a guard in `Index.tsx` that also checks whether profile data has actually been fetched before making the redirect decision.

The simplest, least-invasive fix: change the loading guard in `Index.tsx` to also wait when we have a user but profile data hasn't loaded yet (i.e., `profile` is null/undefined).

Current logic:
```
if (loading || (user && profileLoading)) { show spinner }
```

Updated logic:
```
if (loading || (user && (profileLoading || !profile))) { show spinner }
```

This ensures we never evaluate `isProfileComplete` until the profile row has actually been fetched from the database.

**File: `src/pages/Index.tsx`** -- import `profile` from useProfile, update the loading condition:
- Destructure `profile` alongside `isLoading` and `isProfileComplete` from `useProfile()`
- Change the loading check to: `if (loading || (user && (profileLoading || !profile)))`

That's it -- one file, one line changed, one new destructured variable.
