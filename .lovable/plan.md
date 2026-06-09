# Fix: Password reset link logs user in instead of prompting for new password

## What's happening

When a user clicks the recovery email link, Supabase's `/verify` endpoint exchanges the token, fires a `PASSWORD_RECOVERY` (and `SIGNED_IN`) auth event, then 303-redirects the browser to a URL. The auth logs confirm `/verify → 303` succeeds, but the user lands on the dashboard, not `/reset-password`.

Two causes can produce this:

1. **Supabase Redirect URL allow-list doesn't include `/reset-password`.** When the `redirectTo` value we pass isn't on the allow-list, Supabase silently falls back to the project **Site URL** (the app root). The recovery session is established → `ProtectedRoute` lets them through → they're "just logged in".
2. Even when the redirect works, our `ResetPassword` page only checks `session` — it doesn't listen for the `PASSWORD_RECOVERY` event, so if Supabase ever lands the user on `/` with a recovery hash, nothing routes them to the form.

## Plan

### 1. Code fix — global PASSWORD_RECOVERY handler (defensive)

In `src/hooks/useAuth.tsx`, extend the existing `onAuthStateChange` subscription so that when `event === 'PASSWORD_RECOVERY'` and the current path is not already `/reset-password`, we `window.location.replace('/reset-password')`. This guarantees recovery sessions always reach the form regardless of which URL Supabase lands on.

### 2. Code fix — tighten `ResetPassword` gating

In `src/pages/ResetPassword.tsx`:
- Track whether a `PASSWORD_RECOVERY` event has been observed (or detect `type=recovery` in `window.location.hash` on mount).
- Only show the "Invalid Reset Link" card when there's no session **and** no recovery indicator.
- After successful password update, call `supabase.auth.signOut()` before redirecting to `/auth`, so admins/users don't end up silently logged in as the target account.

### 3. User action — Supabase Auth URL Configuration

The user needs to add these to **Authentication → URL Configuration → Redirect URLs** in the Supabase dashboard (project `wkzgjvnpnhyluxvclymh`):

- `https://app.rprx4life.com/reset-password`
- `https://rprx4life.lovable.app/reset-password`
- `https://id-preview--81677757-fdb1-4d09-bdbd-3f0ee247002a.lovable.app/reset-password`
- `http://localhost:*/reset-password` (for local dev, if used)

Without this, Supabase ignores our `redirectTo` and falls back to Site URL — which is exactly the "just logs me in" symptom.

## Files touched

- `src/hooks/useAuth.tsx` — add PASSWORD_RECOVERY redirect to existing auth listener
- `src/pages/ResetPassword.tsx` — recognize recovery-hash, sign out after update

## Verification

1. Trigger a password reset from the auth page.
2. Click the email link → should land on `/reset-password` with the new-password form (not the dashboard).
3. Submit new password → success message → redirected to `/auth` (signed out), able to log in with the new password.
