
# Sidebar Mini-Courses

Turn any sidebar item into a GHL-style mini-course (modules → lessons with video, files, links, and markdown body). Admin-authored only. User progress is tracked but does not award XP.

## 1. Data model (Supabase)

New tables (all RLS-protected):

- **courses** — one per sidebar item flagged as a course
  - `id` (uuid), `nav_config_id` (text, unique, references `sidebar_nav_config.id`), `title`, `description`, `cover_image_url` (nullable — falls back to default placeholder), `is_published`, timestamps
- **course_modules** — sections within a course
  - `id`, `course_id`, `title`, `description`, `sort_order`
- **course_lessons** — sub-sections / lessons inside a module
  - `id`, `module_id`, `title`, `body_markdown`, `video_url`, `sort_order`, `is_published`
- **course_lesson_attachments** — files + links per lesson
  - `id`, `lesson_id`, `kind` enum (`file` | `link` | `book_call`), `label`, `url` (for links / book-a-call — set per-attachment by admin), `file_path` (storage path for uploads), `sort_order`
- **user_course_progress** — per-user lesson completion
  - `id`, `user_id`, `lesson_id`, `completed_at`, unique(user_id, lesson_id)

Add to `sidebar_nav_config`: `is_course` boolean (default false). When true, the sidebar item routes to `/course/:navConfigId` instead of its `url` and shows a "Course" badge instead of "Coming Soon". Existing "Coming Soon" items stay unchanged until an admin explicitly flags them.

New storage bucket: **`course-assets`** (public read, admin write) for cover images, lesson files, and uploaded MP4 videos.

RLS:
- Authenticated users: SELECT on courses / modules / lessons / attachments where `is_published = true`
- Admins: full ALL access on all course tables
- `user_course_progress`: each user can SELECT / INSERT / DELETE only their own rows

## 2. Admin authoring (`/admin` → new "Courses" tab)

- List of all sidebar items with an "Is course?" toggle (writes `sidebar_nav_config.is_course`)
- For items toggled on, an "Edit course" button opens the **Course Builder**:
  - Course header: title, description, optional cover image upload, published toggle
  - Drag-to-reorder list of **Modules** (add / rename / delete)
  - Inside each module, drag-to-reorder list of **Lessons**
  - Lesson editor (drawer / modal):
    - Title
    - Markdown body (reuse existing markdown editor pattern from KnowledgeBaseTab / WizardCopyTab)
    - Optional video: paste URL (YouTube / Vimeo / Loom auto-embed) OR upload MP4 to `course-assets`
    - Attachments list: add file upload, external link, or "Book a call" link (label + URL set per-attachment by admin — no global default)
    - Published toggle

`NavigationTab` stays for visibility; new `CoursesTab` handles the course flag + content. An item can be hidden via NavigationTab regardless of its course flag.

## 3. User experience

- **Sidebar** (`AppSidebar.tsx`): when `isVisible(configId)` AND `is_course === true`, render the item as a normal NavLink to `/course/:navConfigId` with a small "Course" badge — overrides any "Coming Soon" placeholder.
- **Course page** (`/course/:navConfigId`):
  - Uses default cover-image placeholder when no upload exists
  - Left rail: collapsible module / lesson tree with check marks for completed lessons and a course-level progress bar
  - Main panel: current lesson — video player at top, markdown body, attachments list (files download, links open in new tab, book-a-call links open in new tab), Prev / Next buttons, "Mark complete" button
  - Mobile: tree collapses into a top sheet
- Progress: marking a lesson complete inserts into `user_course_progress`. Course % = completed / total published lessons. No XP, no badge triggers.

## 4. Routing & files

- New route in `src/App.tsx`: `/course/:navConfigId` → `src/pages/CoursePage.tsx`
- New components: `src/components/courses/CourseSidebarTree.tsx`, `LessonViewer.tsx`, `LessonAttachments.tsx`, `VideoEmbed.tsx`
- New admin: `src/components/admin/CoursesTab.tsx`, `src/components/admin/course/CourseBuilder.tsx`, `ModuleList.tsx`, `LessonEditor.tsx`
- New hooks: `src/hooks/useCourse.ts`, `useCourseAdmin.ts`, `useCourseProgress.ts`
- Default cover placeholder image added to `src/assets/`

## 5. Defaults confirmed

- Cover images: default placeholder, admin can upload later per course
- "Book a call" target: per-attachment, set inside the course builder (no global Advisor reuse)
- Coming Soon items: stay as-is until each is flagged as a course
- Hiding the nav item also hides the course route (404 if accessed directly while hidden)
- All courses are global in v1 (no company-scoped overrides)
