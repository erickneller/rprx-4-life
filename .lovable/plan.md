## Course Banner: Spec + Scrim

Two small changes, both presentation-only.

### 1. Document the recommended thumbnail size

- **Recommended:** 1600×400 px (4:1), JPG or PNG, <500KB
- **Minimum:** 1280×320 px
- **Why:** banner renders full-width up to ~1100px at 128–160px tall; portrait/square art gets cropped.

Surface this to admins in `CourseBuilder.tsx` next to the cover image upload field as small helper text ("Recommended: 1600×400 px, wide format").

### 2. Strengthen the gradient scrim in `CoursePage.tsx`

Replace the current single `bg-gradient-to-t from-background to-transparent` overlay with a stronger, layered scrim so the title and description stay readable on any uploaded image:

- A darker bottom-up gradient (e.g. `from-background via-background/80 to-transparent`) covering ~70% of the banner height.
- Title color forced to a high-contrast token (`text-foreground` with a subtle `drop-shadow`) and description switched from `text-muted-foreground` to a lighter on-scrim token so it doesn't disappear over busy images.
- Keep banner heights as-is (`h-32 md:h-40`) and keep `object-cover` — no layout change.

### Out of scope

- No change to image cropping behavior (`object-contain`, separate title block).
- No change to upload pipeline or storage.
- No new fields on the `courses` table.

### Files touched

- `src/pages/CoursePage.tsx` — scrim + title contrast
- `src/components/admin/course/CourseBuilder.tsx` — helper text under cover image input
