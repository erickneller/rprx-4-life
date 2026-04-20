

## RPRx Library — Categorized Video Directory

Mirror the Partners architecture to create a Library of YouTube videos organized by category. Same admin management pattern, same user-facing card grid, same RLS model.

### Database (2 new tables)

**`library_categories`** (mirrors `partner_categories`)
- `id` text PK, `name` text, `description` text, `sort_order` int, `is_active` bool, `created_at` timestamptz

**`library_videos`** (mirrors `partners`)
- `id` uuid PK, `category_id` text FK → library_categories
- `title` text, `description` text (short)
- `video_url` text (YouTube URL — converted to embed via existing `toYouTubeEmbedUrl` helper)
- `thumbnail_url` text nullable (auto-fallback to YouTube thumbnail if blank)
- `sort_order` int, `is_active` bool, `created_at`, `updated_at`

**RLS:** Admins manage all; authenticated users can read active rows. (Same as partners — no per-company visibility table needed unless you want it; library is global by default.)

### Backend hook
`src/hooks/useLibrary.ts` — mirrors `usePartners.ts`:
- `useLibraryCategories()`, `useAllLibraryCategories()`
- `useLibraryVideos()`, `useAllLibraryVideos()`
- `useUpsertLibraryCategory()`, `useDeleteLibraryCategory()`
- `useUpsertLibraryVideo()`, `useDeleteLibraryVideo()`
- Reuse `toYouTubeEmbedUrl` from `usePartners.ts` (export it from there or duplicate).

### User-facing page
`src/pages/Library.tsx` — mirrors `Partners.tsx`:
- Header: BookOpen icon + "RPRx Library"
- Group videos by category, render cards with embedded YouTube iframe (16:9 AspectRatio), title, short description.
- Loading skeletons + empty state.

**Routing (`src/App.tsx`):**
- Add `<Route path="/library" element={<ProtectedRoute><WizardGuard><Library /></WizardGuard></ProtectedRoute>} />`

**Navigation:**
- Add `library` entry to `sidebar_nav_config` so it appears in the sidebar (admin can toggle visibility per existing visibility-control system). Place it near Partners under the appropriate section header.

### Admin panel
`src/components/admin/LibraryTab.tsx` — mirrors `PartnersTab.tsx`:
- Two sub-tabs: **Categories** and **Videos**
- Categories: list/add/edit/delete (id, name, description, sort_order, is_active)
- Videos: list/add/edit/delete with category dropdown, title, description, YouTube URL, optional thumbnail URL, sort_order, is_active
- Live YouTube preview when URL is entered (uses `toYouTubeEmbedUrl`)

**Wire into `src/pages/AdminPanel.tsx`:**
- Add a new "Library" tab next to "Partners".

### Files touched
- New: `src/hooks/useLibrary.ts`, `src/pages/Library.tsx`, `src/components/admin/LibraryTab.tsx`
- Edit: `src/App.tsx` (route), `src/pages/AdminPanel.tsx` (tab), `src/hooks/usePartners.ts` (export helper) or duplicate helper
- Migration: 2 new tables + RLS + 1 sidebar_nav_config insert

### Notes
- No engine, scoring, or assessment changes.
- Library is globally visible to all authenticated users (no per-company gating). If you later want company-level hiding like partners, we can add `company_library_visibility` — easy follow-up.
- Suggested seed: 1 sample category ("Getting Started") so the page isn't empty on first load.

