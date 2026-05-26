## Goal
Give signed-in users one place to (a) browse/search the active User Guide and (b) submit a typed request that routes to the right destination.

## 1. New `/help` page (`src/pages/Help.tsx`)
Two-column (stacked on mobile) layout inside `AuthenticatedLayout`:

**Left — Searchable User Guide**
- Pulls active sections via `useUserGuide(true)`.
- Search input filters by title + body (case-insensitive).
- Renders sections as an `Accordion` with markdown bodies (`react-markdown`, matches `PageHelpButton` pattern).
- Empty/loading states.

**Right — Request Help**
- Card with a `Select` dropdown: **Type of request**
  - `help` — General help / question
  - `bug` — Report a bug
  - `feature` — Request a feature
  - `advisor` — Talk to an advisor
- Conditional helper text + behavior per selection:
  - `advisor` → renders a button that routes to `/virtual-advisor` (or the configured advisor link) instead of the form.
  - `help` → shows subject + message form; on submit, also surfaces a "Ask RPRx Assistant" shortcut to `/strategy-assistant` (mirrors `PageHelpButton` chat bridge).
  - `bug` / `feature` → subject + message form, optional "current page URL" auto-filled.
- Form fields: `subject` (required, ≤120), `message` (required, ≤2000), auto-captured `page_url` + `user_agent`.
- Submit inserts into new `support_requests` table; toast on success; resets form.

Route added to `src/App.tsx`:
```tsx
<Route path="/help" element={<ProtectedRoute><WizardGuard><Help /></WizardGuard></ProtectedRoute>} />
```
Add a "Help & Support" entry in `AppSidebar` (bottom of nav) linking to `/help`.

## 2. Database — `support_requests`
Migration creates:
```sql
create type public.support_request_type as enum ('help','bug','feature','advisor');
create type public.support_request_status as enum ('new','in_progress','resolved','archived');

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type support_request_type not null,
  subject text not null,
  message text not null,
  page_url text,
  user_agent text,
  status support_request_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
- GRANTs: `SELECT, INSERT` to `authenticated`; `ALL` to `service_role`.
- RLS: users can `SELECT`/`INSERT` their own rows (`auth.uid() = user_id`); admins (`has_role(auth.uid(),'admin')`) can `SELECT`/`UPDATE`/`DELETE` all rows.
- `updated_at` trigger via existing `update_updated_at_column()`.

## 3. Hooks (`src/hooks/useSupportRequests.ts`)
- `useSubmitSupportRequest()` mutation (insert + invalidate admin list).
- `useAdminSupportRequests()` query (admin list, joined with profile name like `usePageFeedback`).
- `useUpdateSupportRequest()` for status + admin notes.
- `useDeleteSupportRequest()`.

## 4. Admin tab — `src/components/admin/SupportRequestsTab.tsx`
Mirrors `FeedbackTab` UX:
- Table: date, user, type badge, subject, status, actions.
- Row expansion shows message, page_url, user_agent, admin notes editor.
- Status select (new / in_progress / resolved / archived).
- Delete button.
- Filter by type + status.

Add tab to `src/pages/AdminPanel.tsx` (`<TabsTrigger value="support">` + `<TabsContent>`).

## 5. Discoverability
- Sidebar link "Help & Support" (LifeBuoy icon).
- Optional: in existing `PageHelpButton` drawer, add a secondary "Open full help center" link to `/help` (small footer button below the chat bridge).

## Out of scope
- Email/Slack notifications on new requests (can be added later via edge function).
- File attachments.
- Per-company routing.
- Editing the user guide content (already handled by existing `UserGuideTab`).

## Technical notes
- Cast `.from('support_requests' as any)` to bypass deep type instantiation (per project memory).
- Reuse `ReactMarkdown` already in deps.
- Keep tone empowering per brand guide — copy like "How can we help you optimize today?" instead of "Submit a ticket".
