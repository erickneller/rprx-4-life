

# Add Breadcrumb Navigation to Header

## Overview
Replace the current static `logo / title` text in the header with proper interactive breadcrumb links. Dashboard serves as the root, and detail pages (like a specific plan) get a multi-level breadcrumb trail.

## How It Works

The breadcrumb is determined automatically from the current route. Examples:

- `/dashboard` --> Logo / **Dashboard**
- `/plans` --> Logo / Dashboard / **My Plans**
- `/plans/:id` --> Logo / Dashboard / My Plans / **Education Funding - Feb 2026**
- `/profile` --> Logo / Dashboard / **Profile**
- `/results/:id` --> Logo / Dashboard / My Assessments / **Results**
- `/strategy-assistant` --> Logo / Dashboard / **Strategy Assistant**
- `/debt-eliminator` --> Logo / Dashboard / **Debt Elimination System**
- `/assessments` --> Logo / Dashboard / **My Assessments**

The last item in the trail is plain text (current page). All preceding items are clickable links back to those pages.

## Changes

### 1. `src/components/layout/AuthenticatedLayout.tsx`
- Replace the `title` prop with an optional `breadcrumbs` prop: `Array<{ label: string; href?: string }>`
- Keep `title` as a simpler fallback (auto-generates a two-level breadcrumb: Dashboard + title)
- Render using the existing `Breadcrumb` components from `src/components/ui/breadcrumb.tsx`
- Dashboard is always the first clickable crumb after the logo
- The last crumb uses `BreadcrumbPage` (non-clickable, current page indicator)
- Links use `react-router-dom` `Link` for client-side navigation

Updated header structure:
```
[SidebarTrigger] [Logo] / Dashboard / My Plans / Plan Title
                         ^link        ^link      ^current page (plain text)
```

### 2. Update all page files to pass breadcrumb data

Pages with simple breadcrumbs (just use `title` prop, auto-generates Dashboard > Title):
- `Dashboard.tsx` -- title="Dashboard" (renders as just "Dashboard" with no parent link since it IS the root)
- `Profile.tsx` -- title="Profile"
- `Plans.tsx` -- title="My Plans"
- `Assessments.tsx` -- title="My Assessments"
- `StrategyAssistant.tsx` -- title="Strategy Assistant"
- `DebtEliminator.tsx` -- title="Debt Elimination System"
- `AdminPanel.tsx` -- title="Admin Panel"

Pages with deeper breadcrumbs (use `breadcrumbs` prop):
- `PlanDetail.tsx` -- `[{ label: "My Plans", href: "/plans" }, { label: displayTitle }]`
- `ResultsPage.tsx` -- `[{ label: "My Assessments", href: "/assessments" }, { label: "Results" }]`

### 3. No new files needed
We already have `src/components/ui/breadcrumb.tsx` with all the necessary components (`Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage`).

## Technical Details

### AuthenticatedLayout interface update
```typescript
interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}
```

Logic:
- If `breadcrumbs` is provided, render the full custom trail with Dashboard as root
- If only `title` is provided, auto-generate: Dashboard (link) > title (current page)
- If `title` is "Dashboard", render just "Dashboard" as current page (no redundant self-link)
- Use `Link` from react-router-dom inside `BreadcrumbLink` with `asChild`

### Styling
- Matches the existing header height (h-14) and alignment
- Breadcrumb text uses `text-sm` for intermediate items, `text-lg font-semibold` for the last (current page) item
- Separator uses the default `ChevronRight` from the breadcrumb component
- Clickable crumbs use `text-muted-foreground hover:text-foreground` transition

