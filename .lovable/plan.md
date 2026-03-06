

# Connect Help + Chat and Add Admin Chat Toggle

## Overview
Two changes: (1) Add an "Ask RPRx" CTA at the bottom of the help drawer that bridges to the AI chat, and (2) add a global admin switch to enable/disable the chat feature across the app.

## 1. Feature Flag Storage

Add a new `feature_flags` table with a single row for now:

```sql
CREATE TABLE public.feature_flags (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
-- Everyone can read
CREATE POLICY "Anyone can read flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
-- Only admins can update
CREATE POLICY "Admins can update flags" ON public.feature_flags FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert flags" ON public.feature_flags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.feature_flags (id, enabled) VALUES ('chat_enabled', true);
```

## 2. New Hook: `useFeatureFlag`

Create `src/hooks/useFeatureFlag.ts` — queries `feature_flags` by id, returns `{ enabled, isLoading }`. Cached via React Query with key `['feature-flag', id]`.

## 3. Admin Panel — New "Features" Tab

Add a lightweight tab to `AdminPanel.tsx` with a single Switch for "AI Chat Assistant". Toggling it updates the `feature_flags` row. Uses the existing admin tab pattern.

## 4. Consume the Flag

Hide/show the chat feature in these locations when `chat_enabled = false`:

- **Dashboard FAB** (`DashboardContent.tsx`): Conditionally render the floating chat button
- **Sidebar link** (`AppSidebar.tsx`): Conditionally render the "Strategy Assistant" nav item
- **Route** (`App.tsx`): When disabled, the `/strategy-assistant` route redirects to `/dashboard`
- **Help drawer CTA** (new, see below): Only show the "Ask RPRx" button when chat is enabled

## 5. Help Drawer — "Ask RPRx" Bridge

At the bottom of the help drawer in `PageHelpButton.tsx`, add a divider and a button:

```
─────────────────────────
Still have questions?
[💬 Ask RPRx Assistant]
```

Clicking it closes the drawer and navigates to `/strategy-assistant`. Only shown when `chat_enabled` flag is true.

## Files Modified
- **New migration**: `feature_flags` table + seed row
- **New**: `src/hooks/useFeatureFlag.ts`
- **Edit**: `src/pages/AdminPanel.tsx` — add "Features" tab with chat toggle
- **Edit**: `src/components/help/PageHelpButton.tsx` — add "Ask RPRx" CTA at bottom
- **Edit**: `src/components/dashboard/DashboardContent.tsx` — conditionally render chat FAB
- **Edit**: `src/components/layout/AppSidebar.tsx` — conditionally render Strategy Assistant link
- **Edit**: `src/App.tsx` — wrap Strategy Assistant route with flag check

