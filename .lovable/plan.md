## Make the default course banner color globally editable

**Where the orange comes from:** `src/pages/CoursePage.tsx` renders `course.cover_image_url || coverPlaceholder`, where `coverPlaceholder` is the static image `src/assets/course-placeholder.jpg` (the peach/orange gradient). It's the fallback shown for any course without its own cover image.

**Approach:** Replace the static placeholder fallback with an admin-configurable CSS gradient stored in the existing `feature_flags` table (which already has a `value text` column). One global setting, used by every course that doesn't have its own `cover_image_url`. No per-course changes.

### Changes

1. **Seed setting** (migration)
   - Insert a `feature_flags` row: `id = 'course_banner_gradient'`, `enabled = true`, `value = 'from:#fed7aa;to:#fef3c7;angle:135'` (current orange feel as default so nothing visibly changes until admin edits it).

2. **Admin UI** — `src/components/admin/CoursesTab.tsx`
   - Add a "Default Banner" section at the top with: two HSL/hex color pickers (start, end), an angle slider (0–360°), and a live preview swatch.
   - Save button writes the encoded value back to `feature_flags`. Reads via the existing feature-flags hook/pattern.

3. **Course page** — `src/pages/CoursePage.tsx`
   - Read the `course_banner_gradient` flag.
   - When `course.cover_image_url` is missing, render a `<div>` with `background: linear-gradient(...)` using the configured colors instead of the `<img src={coverPlaceholder}>`.
   - Keep the existing dark overlay + title/description on top so contrast stays good in dark mode.
   - Remove the now-unused `coverPlaceholder` import (asset file stays for safety).

### Notes
- Only one global setting — no per-course override added.
- Existing courses that have uploaded a cover image are unaffected.
- No schema changes beyond seeding one row in the existing `feature_flags` table.