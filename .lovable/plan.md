
# Admin Insights Dashboard

A new platform-admin-only dashboard at `/admin/insights` for drilling into users by subscription tier and seeing per-user activity, plus company-level rollups. v1 ships users + companies together with lightweight video-open tracking across courses and library.

## 1. Video open tracking (lightweight)

New table `video_open_events` to log every time an authenticated user opens a video — both course lessons and library videos.

Columns:
- `id uuid pk`
- `user_id uuid` (auth.uid())
- `source text` — `'course_lesson' | 'library_video'`
- `source_id uuid` — lesson id or library video id
- `title text` — denormalized for fast reporting
- `video_url text` — nullable
- `opened_at timestamptz default now()`

RLS:
- `authenticated` can INSERT own rows (`user_id = auth.uid()`)
- `authenticated` can SELECT own rows
- Admins (`has_role(auth.uid(),'admin')`) can SELECT all
- Standard GRANTs (SELECT/INSERT to authenticated, ALL to service_role)

Instrumentation:
- New hook `useLogVideoOpen()` that inserts a row, debounced once per (user, source_id) per 5 minutes via in-memory set to avoid spam.
- Call site 1: `src/components/media/VideoPlayer.tsx` on first play / when `video_url` becomes visible in `CoursePage` lesson view.
- Call site 2: `src/pages/Library.tsx` (and any video card in library) on click/open.
- Pass `source`, `source_id`, `title` as props.

## 2. Database additions

Two new SECURITY DEFINER RPCs (admin-only checks inside):

- `admin_user_activity_summary(_user_id uuid)` → returns one row:
  - profile basics (full_name, email, company_id, company_name, tier, last_active_date, current_streak, total_points_earned, onboarding_completed)
  - assessments_completed (count)
  - plans_saved, focus_plan_title
  - badges_earned
  - course_lessons_opened (distinct count from video_open_events where source='course_lesson')
  - library_videos_opened (distinct count)
  - total_video_opens
  - last_video_opened_at

- `admin_company_activity_rollup()` → one row per company:
  - id, name, plan, member_count
  - members_by_tier (jsonb: free/partner/pro counts)
  - active_last_7d, active_last_30d
  - assessments_completed, plans_saved
  - total_video_opens, course_opens, library_opens
  - avg_streak

Both guarded with `if not has_role(auth.uid(),'admin') then raise exception ...`.

Reuse the existing `admin_list_users()` for the per-tier users list (tier computed client-side via `get_subscription_tier` if needed, or add a new RPC `admin_list_users_with_tier()` that joins tier in SQL for efficient filtering — recommended).

## 3. Routes & navigation

- New route `/admin/insights` wrapped in existing `AdminRoute`.
- Add sidebar entry under the existing admin area ("Insights") visible only to admins.
- Page structure with three sub-tabs (shadcn `Tabs`):
  1. **Overview** — top KPIs (total users, by tier, active 7d/30d, total video opens, top 5 videos)
  2. **Users** — filterable table
  3. **Companies** — company rollup table + drill-in

## 4. Users tab UI

- Filters: tier (All / Free / Partner / Pro), company (dropdown), search by name/email.
- Table columns: Name, Email, Company, Tier badge, Last Active, Streak, Assessments, Plans, Videos Opened, Actions.
- Row click → side drawer (shadcn `Sheet`) showing `admin_user_activity_summary` detail:
  - Profile snapshot
  - Activity counts
  - Recent video opens (last 20, with source + title + opened_at) from `video_open_events`
  - Badges earned list
  - Saved plans list (titles + focus flag)

## 5. Companies tab UI

- Table of companies with rollup metrics from `admin_company_activity_rollup`.
- Click row → drawer showing:
  - Member list (reuses Users table filtered by company)
  - Tier breakdown bar chart (recharts)
  - Videos opened by source (course vs library)
  - Signups over time (reuse existing chart pattern from `CompanyDashboard.tsx`)

## 6. Hooks

- `useAdminUsersWithTier()` — fetches users + tier in one shot
- `useAdminUserActivity(userId)` — calls `admin_user_activity_summary`
- `useAdminCompanyRollup()` — calls `admin_company_activity_rollup`
- `useAdminVideoOpens({userId?, companyId?, limit})` — recent opens for drawers
- `useLogVideoOpen()` — instrumentation hook

All use React Query; all cast `.from()`/`.rpc()` to `any` for new tables per project's deep-type bypass rule.

## 7. Files to create

- `supabase/migrations/<ts>_admin_insights.sql` — table, grants, RLS, RPCs
- `src/pages/admin/Insights.tsx`
- `src/components/admin/insights/InsightsOverviewTab.tsx`
- `src/components/admin/insights/UsersTab.tsx`
- `src/components/admin/insights/CompaniesTab.tsx`
- `src/components/admin/insights/UserDetailDrawer.tsx`
- `src/components/admin/insights/CompanyDetailDrawer.tsx`
- `src/hooks/useAdminInsights.ts` (all hooks above)
- `src/hooks/useLogVideoOpen.ts`

## 8. Files to edit

- `src/App.tsx` — add `/admin/insights` route under `AdminRoute`
- `src/components/layout/AppSidebar.tsx` (or sidebar config) — add Insights nav item (admin-only)
- `src/components/media/VideoPlayer.tsx` — log open on first play
- `src/pages/CoursePage.tsx` — pass source metadata to player
- `src/pages/Library.tsx` — log open on library video click
- `supabase/functions/admin-data-export/index.ts` — add `video_open_events` to `ALLOWED_TABLES`

## 9. Out of scope (v1)

- Course completion logic (we log opens only, per your direction)
- % watched / progress instrumentation
- Company-admin scoped view (admins only)
- CSV export buttons on insights tab (data already exportable via existing admin export tool)

## Technical notes

- Use `Sheet` for drawers to keep mobile parity.
- Charts via existing `recharts` install.
- All new colors via semantic tokens (no raw Tailwind colors).
- New table grants:
  ```
  GRANT SELECT, INSERT ON public.video_open_events TO authenticated;
  GRANT ALL ON public.video_open_events TO service_role;
  ```
- Index `video_open_events(user_id, opened_at desc)` and `(source, source_id)` for rollup speed.
