

# Contextual Page Help System

## Overview
Add a floating help button to all authenticated pages that shows page-specific instructions, video placeholders, and markdown-rendered help content in a slide-out drawer. Fully admin-managed via a new "Page Help" tab.

## Concerns and Decisions

1. **react-markdown is already installed** -- we'll use it for rendering help body content (already used elsewhere in the project).
2. **localStorage hint dismissal** -- The spec says "reset hint when navigating to a NEW page they haven't seen before." We'll store a Set of dismissed page IDs rather than a single boolean, so each page gets its own first-visit hint.
3. **Sheet vs custom drawer** -- The project already has a `Sheet` component (Radix Dialog-based, slides from right). We'll reuse it rather than building a custom drawer, keeping consistency.
4. **Admin Panel is already large (922 lines)** -- We'll create a separate `PageHelpTab.tsx` component file in `src/components/admin/` to keep things modular, matching the pattern used by `BadgesTab`, `OnboardingTab`, etc.

## Database Changes

### New table: `page_help_content`

```sql
CREATE TABLE public.page_help_content (
  id text PRIMARY KEY,
  page_name text NOT NULL,
  hint_text text NOT NULL,
  help_title text NOT NULL,
  help_body text NOT NULL,
  video_url text,
  video_placeholder_text text NOT NULL DEFAULT 'Video tutorial coming soon',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_help_content ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read page help"
  ON public.page_help_content FOR SELECT
  TO authenticated USING (true);

-- Admin CRUD
CREATE POLICY "Admins can insert page help"
  ON public.page_help_content FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page help"
  ON public.page_help_content FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page help"
  ON public.page_help_content FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

### Seed data
Insert help content for: dashboard, profile, assessment, results, plans, strategies (using the content from the spec).

## New Files

### 1. `src/hooks/usePageHelp.ts`
- Uses `useLocation()` to get current path
- Maps path to page ID:
  - `/dashboard` -> `dashboard`
  - `/profile` -> `profile`
  - `/assessment` -> `assessment`
  - `/results/*` -> `results`
  - `/plans` or `/plans/*` -> `plans`
  - `/strategy-assistant` -> `strategies`
  - `/debt-eliminator` -> (no match initially, can be added via admin later)
- Fetches from `page_help_content` where `id = pageId` and `is_active = true`
- React Query cache key: `['page-help', pageId]`
- Returns `{ helpContent, isLoading }`

### 2. `src/components/help/PageHelpButton.tsx`
- **Floating button**: Fixed position bottom-6 right-6, z-40, 48px circle with HelpCircle icon
- **Hint pill**: Shown next to button on first visit to each page. Dismissible with X. Uses localStorage key `help_hints_dismissed` storing a JSON array of page IDs.
- **Help drawer**: Uses the existing `Sheet` component (side="right"). Contains:
  - Help title (h2)
  - Video section: iframe for YouTube/Vimeo URLs, `<video>` for direct URLs, or placeholder card with Play icon when null
  - Help body rendered with `react-markdown` (already installed)
- **Auto-hide**: Returns null if `usePageHelp` returns no content
- Subtle styling: `bg-blue-500/10 hover:bg-blue-500/20 text-blue-600`, shadow, scale animation on hover

### 3. `src/components/admin/PageHelpTab.tsx`
- Table listing all `page_help_content` rows: Page Name, Hint Text, Has Video (icon), Active (toggle), Edit button
- Edit dialog with fields: Page ID (read-only on edit), Page Name, Hint Text, Help Title, Help Body (textarea), Video URL, Video Placeholder Text, Active toggle
- "Add Page" button for new entries (Page ID is editable on create)
- Uses React Query for fetching + mutations for upsert/delete

## Integration Points

### `src/components/layout/AuthenticatedLayout.tsx`
- Import and render `<PageHelpButton />` inside the layout, after `<main>`. This makes it appear on all authenticated pages automatically without touching individual page files.

### `src/pages/AdminPanel.tsx`
- Import `PageHelpTab`
- Add a new `TabsTrigger` with a `BookOpen` icon labeled "Page Help"
- Add corresponding `TabsContent` rendering `<PageHelpTab />`

## What This Does NOT Touch
- No changes to individual page files
- No changes to routing
- No changes to existing components
- Non-authenticated pages (landing, auth, admin) won't show the help button since it lives inside `AuthenticatedLayout` and auto-hides when no content matches

