

# Fix: New Users Not Redirected to Wizard After Signup

## Investigation Summary

The routing logic in `Index.tsx` is correct: it checks `isProfileComplete` (which is `false` for new users since `monthly_income` is null) and redirects to `/wizard` when there are no completed assessments. The `WizardGuard` also correctly redirects incomplete users.

However, there are two issues that could prevent the wizard from appearing:

## Issue 1: Auth.tsx navigates away immediately on auto-login

With `immediate_login_after_signup: true`, the Supabase auth state changes immediately after signup. The `useEffect` in `Auth.tsx` (line 76-80) fires and navigates to `/` before the user sees the success message. This is technically correct behavior BUT creates a confusing flash -- the user briefly sees the success message, then gets redirected.

**Fix**: After a successful signup with auto-login, navigate directly to `/wizard` instead of showing the "check your email" message. Detect that the user is now logged in and skip the success message entirely.

## Issue 2: WizardGuard loading bypass

`WizardGuard` (line 16) returns `children` (i.e., renders the page) while profile data is loading. If a user navigates directly to `/dashboard`, they'll briefly see the dashboard before being redirected. This is a minor UX issue but not the root cause.

## Changes

### 1. `src/pages/Auth.tsx`

Update the signup handler: after a successful `signUp` call, check if the user is immediately logged in. If so, navigate to `/wizard` directly instead of showing the email confirmation message. This avoids confusion and ensures the wizard is the first thing a new user sees.

```text
// After successful signup:
if auto-login occurred (user exists after signUp):
  navigate('/wizard', { replace: true })
else:
  show "check your email" message (for cases where email confirmation is required)
```

Also update the `useEffect` to navigate to `/` only if the user was already logged in (not from a fresh signup), or simply keep it navigating to `/` and let Index.tsx handle the routing (which already works).

### 2. `src/pages/Auth.tsx` -- Prevent race condition

The `useEffect` that navigates on `user` change fires for both login AND signup. For signup with auto-login, both the success handler and the useEffect compete. Fix: add a ref to track if we just signed up, and in that case navigate to `/wizard` from the handler, not the useEffect.

### File Summary

| File | Action |
|------|--------|
| `src/pages/Auth.tsx` | Edit -- navigate to `/wizard` after successful signup with auto-login, prevent race with useEffect |

## Technical Details

- Add a `justSignedUp` ref in Auth.tsx
- In the signup success branch, check if `supabase.auth.getSession()` returns a session (indicating auto-login). If so, set `justSignedUp.current = true` and navigate to `/wizard`
- In the `useEffect`, skip navigation if `justSignedUp.current` is true
- This ensures new users always land on the wizard immediately after signup

