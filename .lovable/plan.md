Remove the "Course" label badge that appears after sidebar navigation items with `linkType === 'course'`.

## Files
- `src/components/layout/AppSidebar.tsx` — delete the conditional `<span>` inside `NavItemRow` that renders `Course`.

## Details
The `NavItemRow` component renders a small uppercase "Course" span next to any sidebar item whose `link_type` is `'course'`. Removing this 3-line block eliminates the badge from all course-linked navigation items (e.g., RPRx Strategy GPT, Escape Financial Apocalypse, 30 Day Physical Reset). The items still route to the course view; only the text label is removed.