## Goal

Make the sidebar fully data-driven so admins can add, edit, delete, reorder, and toggle visibility of sections and items from the Navigation tab — and seamlessly attach a course to any item.

---

## 1. Database changes

Extend `sidebar_nav_config` to hold everything needed to render the sidebar:

New columns:
- `kind` text — `'section' | 'item'`
- `parent_id` text nullable — section id (for items)
- `icon` text nullable — lucide icon name (e.g. `"Target"`)
- `url` text nullable — `/route`, `https://...`, or `#` for coming-soon
- `link_type` text — `'route' | 'external' | 'course' | 'coming_soon'`
- `is_system` boolean default false — protects built-in items from deletion (Dashboard, Profile, Admin link, etc.)

`is_course` becomes a derived convenience flag (kept for back-compat) — driven by `link_type = 'course'`.

A seed migration inserts every currently hardcoded section/item with `is_system = true`, preserving existing ids so existing visibility rows and any course rows linked by `nav_config_id` keep working.

RLS stays the same (admin write, authenticated read).

---

## 2. Admin UI — rebuilt `NavigationTab`

Sections listed top-to-bottom; items nested under each. Each row has:
- Label (inline editable)
- Icon picker (full lucide-react search dialog)
- Link type dropdown: Internal route / External link / Course / Coming Soon
- URL field (hidden for course/coming-soon; route picker for internal)
- Visibility switch
- Up/Down arrows for sort order
- Edit / Delete buttons (delete disabled when `is_system = true`)
- For items with `link_type = 'course'`: a "Open Course Builder" shortcut

Top of tab: "Add Section" and (per section) "Add Item" buttons.

---

## 3. Sidebar rendering — `AppSidebar.tsx`

Remove hardcoded `sections` and `navItems` arrays. Build the tree from `sidebar_nav_config` rows ordered by `sort_order`, grouped by `parent_id`. Resolve icons via a `lucide-react` name → component map.

Behavior matrix:
- `coming_soon` → non-clickable "(Coming Soon)" pill (existing style)
- `route` → `<NavLink to={url}>`
- `external` → `<a target="_blank">`
- `course` → `<NavLink to={"/course/" + id}>` with "Course" badge

System items (Strategy Assistant, Advisor CTA, Company Dashboard, Admin Panel) keep their special conditional rendering (feature flag / role checks) but their visibility row still controls hide/show.

---

## 4. Course sync

Courses already key off `nav_config_id`. When admin sets `link_type = 'course'` on an item:
- A draft `courses` row is auto-created if none exists
- "Open Course Builder" link surfaces inline
- Switching away from `course` keeps the course row but hides it (course only renders when item is course-typed)
- Deleting a non-system item cascades the course (handled by app-level delete that removes the course first, then the nav row)

---

## 5. Files touched

- **Migration** — extend `sidebar_nav_config`, seed system rows
- **`useSidebarConfig.ts`** — return tree structure, add CRUD mutations (`useUpsertNavRow`, `useDeleteNavRow`, `useReorderNavRow`)
- **`NavigationTab.tsx`** — full rewrite as editor
- **`AppSidebar.tsx`** — render from DB tree, remove hardcoded arrays
- **New `IconPicker.tsx`** — searchable lucide picker dialog
- **New `lib/lucideIconMap.ts`** — name → component lookup with fallback

No changes to `CoursesTab` / `CourseBuilder` — they keep working off `nav_config_id`.

---

## Out of scope (call out for later)

- Per-company sidebar overrides
- Drag-and-drop reordering (using arrows for v1)
- Sub-sub-sections (only one level of nesting)
