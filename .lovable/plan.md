## Problem

New user `ekneller@gmail.com` signed up via `/join?token=...` and got stuck on the "Setting things up…" spinner. Investigation shows:

- Auth user exists, `profiles` row exists **with `company_id` set**, but there is **no matching `company_members` row**.
- RLS on `public.company_members` only allows a user to insert themselves if they are the company **owner** ("Company owners can add themselves on create"). Regular invited members cannot insert directly — only the `SECURITY DEFINER` RPC `join_company_by_token` can.
- `src/hooks/useProfile.ts` (lines 127–137) tries a direct client-side upsert into `company_members` on first profile creation. This **silently fails under RLS** for invited members and never creates the row. It also fire-and-forgets and removes `pending_invite_token` inside a `.then()` that only runs on success — masking the failure.
- `src/pages/Join.tsx` autoJoin then depends on `joinByToken` RPC to finish, but if anything in the chain (profile query, assessments query, preset query) errors or the mutation throws, the page has no error UI (line 224 only shows errors when `pendingCompany` is null) and no timeout — so `user || pendingNavigate` keeps rendering the "Setting things up…" spinner forever.
- Join.tsx also calls `resolveFinalOnboardingPath` **without `onboardingCompleted`**, unlike `Index.tsx`, which would route a completed user incorrectly.

## Fix Plan

### 1. `src/hooks/useProfile.ts` — stop trying to write `company_members` from the client
- Remove the client-side `company_members` upsert block (the RLS-blocked one).
- Do **not** set `company_id` / `company_role` on the initial `profiles` insert either — that field belongs to the RPC. Insert only `id`, `full_name`, `phone`.
- Keep the `pending_invite_token` in localStorage untouched here; `useCompany.joinByToken` already clears it via its `onSuccess`.

Result: after signup the profile exists without a company, and the single source of truth for company assignment becomes the `join_company_by_token` RPC (called from Join.tsx and AuthCallback flow).

### 2. `src/pages/Join.tsx` — make autoJoin resilient and observable
- Add local `joinError` state and render it inline (with a "Try again" button) instead of the silent spinner when `joinByToken` throws.
- Add a hard timeout (e.g. 15 s) around the "waiting for preset/profile/assessments" gate; if data still isn't ready, fall back to `navigate('/dashboard')` and log a warning, rather than spinning forever.
- Pass `onboardingCompleted: profile?.onboarding_completed` into `resolveFinalOnboardingPath` (bring in `useProfile` to read it), matching `Index.tsx`.
- Guard against the effect re-firing after an error by only re-running `joinByToken` when `hasJoined` is false **and** `joinError` is null.

### 3. Backfill the stuck user
Run a one-off SQL migration to insert the missing membership so ekneller can actually load company-scoped screens:

```sql
INSERT INTO public.company_members (company_id, user_id, role)
VALUES ('8c989625-dd12-402e-85d7-4db6c568c03d',
        '8c0cdaf1-f0f3-471f-85a2-7ffcc0d23835',
        'member')
ON CONFLICT (company_id, user_id) DO NOTHING;
```

(Their `profiles.company_id` is already correct — no other backfill needed.)

### 4. Verify
- Re-run through `/join?token=...` in an incognito session, confirm:
  - `company_members` row is created via the RPC.
  - Page navigates to `/dashboard` (company override is `dashboard_silent`).
  - If the RPC is forced to fail (e.g. bad token), an inline error appears instead of the infinite spinner.

## Out of scope
- No changes to the RLS policies on `company_members` — the SECURITY DEFINER RPC is the correct write path and stays the only one.
- No MCP / OAuth changes.
