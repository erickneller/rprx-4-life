## Visual Refresh: Course Lesson Navigation & Resource Links

Update the course lesson page (CoursePage) to make interactive elements more visually distinct using the project's existing design tokens.

### Changes

1. **Resource link rows (AttachmentRow)** — Change from neutral card styling to **accent blue background with white text** (`bg-accent text-accent-foreground`) so they clearly appear as actionable links.

2. **Next button** — Change from `variant="outline"` to **accent blue background with white text** (`bg-accent text-accent-foreground hover:bg-accent/90`) so it stands out as the primary forward action.

3. **Mark complete button** — Change from `variant="default"` / `variant="secondary"` to **green background with white text** (`bg-success text-success-foreground hover:bg-success/90`) for both the uncompleted and completed states.

### Technical Details

- All colors use existing semantic Tailwind tokens already mapped in `tailwind.config.ts` (`accent`, `accent-foreground`, `success`, `success-foreground`).
- No new CSS variables or design tokens are needed.
- Only `src/pages/CoursePage.tsx` is modified.
- The `Prev` button remains `variant="outline"` as a secondary action.