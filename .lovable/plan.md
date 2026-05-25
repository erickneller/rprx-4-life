## Library Page Filters & Sort

Add filtering and sorting controls to `/library` so users can browse videos by category and order them by date.

### UI changes (`src/pages/Library.tsx`)
- Add a controls row above the video sections:
  - **Category filter** — a `Select` (shadcn) with "All Categories" as the default option followed by each active category from `useLibraryCategories()`.
  - **Sort** — a `Select` with "Newest first" (default) and "Oldest first" options, sorting by `created_at`.
- Keep current grouped-by-category section layout when "All Categories" is selected, but apply the sort within each section.
- When a specific category is selected, render a single section (that category's name + description) with its videos sorted.
- Preserve existing tier-gating, lock cards, and video player behavior unchanged.
- Show the empty-state card if the filtered result has zero videos.

### State
- Local `useState` for `selectedCategoryId: string` (default `"all"`) and `sortOrder: "newest" | "oldest"` (default `"newest"`).
- Derive `grouped` from the existing categories/videos plus these two filters — no data-layer changes, no hook changes, no DB changes.

### Out of scope
- No changes to admin, hooks, or schema.
- No tier filter (existing per-video tier gating remains).
