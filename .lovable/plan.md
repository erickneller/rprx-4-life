## Goal
Fix the admin panel's "Reset password" action so it actually sends a recovery email (today it silently does nothing because `admin.generateLink` only generates a link — it doesn't send mail).

## Change
**File:** `supabase/functions/admin-user-actions/index.ts` — `reset-password` case only.

Replace the current `serviceClient.auth.admin.generateLink({ type: "recovery", ... })` call with `anonClient.auth.resetPasswordForEmail(email, { redirectTo })`, which is the same path the working "Forgot password" flow on `/auth` uses.

Details:
- Keep the existing admin auth + admin-role check.
- Keep `getUserById` to resolve the target user's email and 404 if missing.
- Derive `redirectTo` from the request's `Origin`/`Referer` header → `${origin}/reset-password` so the link lands on the existing reset page (matches what `useAuth.resetPasswordForEmail` does).
- Call `anonClient.auth.resetPasswordForEmail(email, { redirectTo })`.
- Map Supabase's rate-limit response (HTTP 429 / "rate limit" message) to a friendly 429 toast: "Please wait a moment before requesting another reset email for this user." Other errors return the underlying message with status 400.
- Update success message to include the recipient email: `Password reset email sent to <email>`.

After the edit: redeploy `admin-user-actions` so the change takes effect.

## Not changing
- Admin UI / button wiring — the existing call site already shows a toast from the response.
- `ban-user` and `delete-user` cases.
- No DB or schema changes.
- No new secrets.

## Verification
1. From `/admin`, click "Reset password" on a test user.
2. Confirm a `mail.send` event with `mail_type: recovery` appears in auth logs (same shape as the working `/auth` flow).
3. Confirm the email arrives and the link routes to `/reset-password`.
4. Click again immediately → expect the friendly 429 toast (Supabase's ~23s cooldown).
