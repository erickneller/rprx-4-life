## What the warning is really about

The scanner flagged `public.assessment_submissions`. RLS *is* enabled, but the INSERT policy is `WITH CHECK (true)` for `anon` + `authenticated`. That means anyone with the project URL can POST arbitrary rows containing names, emails, and phone numbers — spoofing PII for other people, flooding the table, or polluting your GHL pipeline.

(There is no public SELECT/UPDATE/DELETE — only admins can read, no one can update/delete — so the "read, edit, and delete" wording in the warning is a generic template. The real risk is unrestricted anonymous writes of PII.)

## Goal

Keep the public Health Assessment funnel working (no login required) while removing direct anon write access to the table.

## Plan

1. **Move the insert server-side.** Create a new public edge function `submit-health-assessment` (with `verify_jwt = false` in `supabase/config.toml`) that:
   - Accepts the same payload `Step5Contact.tsx` builds today.
   - Validates fields server-side (zod-equivalent: trimmed name parts, email regex, phone length, persona enum, scores numeric).
   - Applies a simple in-memory + DB rate limit: max ~5 submissions per IP per hour (look up by `created_at > now() - 1h` and the request IP captured in a new `submitter_ip inet` column; reject if exceeded).
   - Inserts via the **service role** key (bypasses RLS).
   - Then forwards to GHL using the existing signed-webhook helper (consolidating with `send-to-ghl`, or just calling it).

2. **Lock down the table.** Migration:
   - Drop the policy `"Anyone can submit health assessments"` on `assessment_submissions`.
   - Add column `submitter_ip inet` (nullable) for rate-limit lookups and abuse forensics.
   - Keep the existing admin-SELECT policy untouched.
   - Result: no anon/auth client can insert directly — only the edge function (service role) can write.

3. **Update the client.** In `src/components/health-assessment/Step5Contact.tsx`:
   - Replace the `supabase.from('assessment_submissions').insert(...)` + separate `send-to-ghl` invoke with a single `supabase.functions.invoke('submit-health-assessment', { body: webhookPayload })` call.
   - Keep the same UX: success → `setCurrentStep(6)`; error → toast.

4. **Optional hygiene (same migration).** While we're in there, the scan also flagged that any `admin` can grant the admin role to anyone via `user_roles` INSERT. Out of scope for this fix, but worth noting — I'll leave it alone unless you say otherwise.

## Files touched

- `supabase/functions/submit-health-assessment/index.ts` (new)
- `supabase/config.toml` (register the function with `verify_jwt = false`)
- `src/components/health-assessment/Step5Contact.tsx` (swap insert → function invoke)
- One migration: drop anon INSERT policy + add `submitter_ip` column

## What this does NOT change

- The 25 other linter warnings (mostly `SECURITY DEFINER` functions exposed to authenticated users — by design for things like `has_role`, `is_company_member`, etc.) and the leaked-password-protection toggle. Those are separate conversations.
