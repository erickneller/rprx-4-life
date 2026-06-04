# Admin Notification Emails for Feedback & Support Requests

Send one email per submission to a configurable list of admin recipients, using Lovable Emails (own domain, queued + retried, logged).

## 1. Prerequisites (one-time setup)

Lovable Emails is not yet set up on this project. Before any code runs, we need:

1. **Email domain** — verified sender subdomain (e.g. `notify.rprx4life.com`). If none exists, I'll surface the email setup dialog.
2. **Email infrastructure** — `setup_email_infra` (pgmq queues, `process-email-queue` cron, `email_send_log`, etc.).
3. **Transactional scaffold** — `scaffold_transactional_email` (creates `send-transactional-email` function + template registry).

DNS verification can run in the background — code below can ship in parallel.

## 2. Configurable recipient list

New table `admin_notification_recipients`:

| column | purpose |
|---|---|
| `email` | recipient address (unique) |
| `label` | optional friendly name |
| `notify_feedback` | bool, default true |
| `notify_support` | bool, default true |
| `active` | bool, default true |

RLS: only `admin` role can select/insert/update/delete. SECURITY DEFINER RPC `get_admin_notification_recipients(_kind text)` returns active emails for the given kind — called by the edge function with the service role, so RLS isn't a blocker but keeps the table locked down for direct client reads.

Admin UI: new "Notification Recipients" card inside `AdminPanel.tsx` — simple table + add/remove/toggle. Seed with the current authenticated admin's email on first load.

## 3. Email templates (React Email)

Two templates in `supabase/functions/_shared/transactional-email-templates/`:

- **`admin-feedback-notification.tsx`** — subject: `New page feedback: {rating}★ on {page_route}`. Body: submitter name/email, page route, rating (with stars), comment, timestamp, link to `/admin` feedback tab.
- **`admin-support-notification.tsx`** — subject: `New {type} request: {subject}`. Body: submitter, type badge, subject, message, page URL, timestamp, link to `/admin` support tab.

Both follow existing brand styling (white body, brand accent on CTA), no unsubscribe text (system appends it).

Register both in `registry.ts`.

## 4. Fan-out edge function

New `notify-admins` edge function (`verify_jwt = false`, validates JWT in code):

1. Body: `{ kind: 'feedback' | 'support', record_id: uuid }`.
2. Loads the record from `page_feedback` / `support_requests` using service role.
3. Loads submitter `full_name` + `email` from `profiles` / `auth.users`.
4. Calls `get_admin_notification_recipients(kind)`.
5. For each recipient, invokes `send-transactional-email` with:
   - `templateName`: matching template
   - `recipientEmail`: that admin
   - `idempotencyKey`: `admin-{kind}-{record_id}-{recipient_email_hash}` (so retries don't double-send)
   - `templateData`: the assembled context.

One queued email per recipient = independent retries, individual `email_send_log` rows.

## 5. Triggers (client-side, immediate)

Wire into existing hooks so we don't need DB triggers:

- **`usePageFeedback.ts → useSubmitFeedback`**: after the insert succeeds, fire-and-forget `supabase.functions.invoke('notify-admins', { body: { kind: 'feedback', record_id: data.id }})`. Errors are logged but do not block the user.
- **`useSupportRequests.ts → useSubmitSupportRequest`**: same pattern with `kind: 'support'`.

Fire-and-forget keeps the submitter's UX snappy; the queue handles delivery + retry.

## 6. Admin UI additions

In `AdminPanel.tsx`, add a "Notification Recipients" section:
- List of current recipients with toggles for feedback/support and remove button.
- Add-recipient form (email + optional label).
- Helper text: "These addresses receive an email whenever a user submits page feedback or a support request."

## Technical details

- **Files created**: migration (table + RPC + RLS), `supabase/functions/notify-admins/index.ts`, two `.tsx` templates, `useAdminNotificationRecipients.ts` hook, `AdminNotificationRecipients.tsx` component.
- **Files edited**: `_shared/transactional-email-templates/registry.ts`, `usePageFeedback.ts`, `useSupportRequests.ts`, `AdminPanel.tsx`, `supabase/config.toml` (register `notify-admins` with `verify_jwt = false`).
- **Idempotency**: per-recipient key prevents duplicates if the client retries.
- **No PII leaks to anon**: recipient list table denies anon access; emails only sent to listed admins.
- **Out of scope (v1)**: per-recipient digest mode, severity filtering, in-app notification bell. Easy follow-ups once this is live.

## What you'll need to do

1. Approve the email domain setup dialog when it appears (one-time DNS).
2. Open Admin Panel → Notification Recipients → add the admin emails that should receive alerts.

Everything else is automatic after that.