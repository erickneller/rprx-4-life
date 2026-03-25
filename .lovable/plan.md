

# Page Feedback System with Test Mode

## Overview
Add a global "Test Mode" toggle in admin that, when enabled, shows a feedback widget on every authenticated page. Users rate 1-5 stars and leave a comment. Admins see all feedback grouped by page with archive, delete, and CSV export.

## Database

### New table: `page_feedback`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | references auth.users |
| page_route | text | e.g. "/dashboard", "/plans" |
| rating | integer | 1-5 |
| comment | text | nullable |
| archived | boolean | default false |
| created_at | timestamptz | default now() |

RLS: Users can INSERT their own feedback. Admins can SELECT/UPDATE/DELETE all.

### New feature flag row
Insert `test_mode` into `feature_flags` table (enabled: false).

## Components

### 1. Feedback Widget (`src/components/feedback/PageFeedbackWidget.tsx`)
- Floating button (bottom-left) on all authenticated pages, visible only when `test_mode` flag is enabled
- Click opens a small popover/dialog with:
  - 5 clickable stars (highlight on hover/select)
  - Textarea for comment (optional, max 500 chars)
  - Submit button
- Auto-detects current page route via `useLocation()`
- On submit: inserts into `page_feedback`, shows success toast
- Added to `AuthenticatedLayout` alongside the existing `PageHelpButton`

### 2. Admin Features Tab Update (`src/components/admin/FeaturesTab.tsx`)
- Add a second card: "Test Mode / Page Feedback" with a switch for the `test_mode` feature flag
- Description: "When enabled, a feedback widget appears on all pages for users to rate and comment."

### 3. Admin Feedback Tab (`src/components/admin/FeedbackTab.tsx`)
- New tab in AdminPanel: "Feedback" with a star icon
- Groups feedback by `page_route` using collapsible/accordion sections
- Each section header shows: page name, count, average rating
- Each row shows: user name, rating (stars), comment, date, archived status
- Action buttons per row: Archive/Unarchive, Delete
- Top-level controls:
  - Filter: All / Active / Archived
  - Export CSV button (exports filtered results with columns: page, user, rating, comment, date, archived)
  - Bulk delete archived

### 4. Hook: `usePageFeedback.ts`
- `useSubmitFeedback()` — mutation to insert feedback
- `useAdminFeedback()` — query all feedback (admin only, joins profiles for user name)
- `useArchiveFeedback()` — mutation to toggle archived
- `useDeleteFeedback()` — mutation to delete

## Files to Create
- `src/components/feedback/PageFeedbackWidget.tsx`
- `src/components/admin/FeedbackTab.tsx`
- `src/hooks/usePageFeedback.ts`
- New migration for `page_feedback` table + RLS

## Files to Modify
- `src/components/layout/AuthenticatedLayout.tsx` — add `PageFeedbackWidget`
- `src/components/admin/FeaturesTab.tsx` — add Test Mode toggle card
- `src/pages/AdminPanel.tsx` — add Feedback tab

