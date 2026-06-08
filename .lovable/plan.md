## Allow images in lesson Body (Markdown)

Enhance the "Body (Markdown)" field in the lesson editor (`src/components/admin/course/CourseBuilder.tsx`) so course authors can add images by **pasting from the clipboard**, **drag-and-drop**, or a new **"Insert image" button**. Rendering already supports images — `CoursePage.tsx` renders the body with `ReactMarkdown` + `rehypeRaw`, so an inserted `![alt](url)` will display correctly.

### Changes

1. **`src/components/admin/course/CourseBuilder.tsx`** (LessonDialog)
   - Add a `textareaRef` to the Body textarea.
   - Add helper `insertAtCursor(text)` that splices markdown at the current caret and updates `body` state.
   - Add `uploadImageFile(file: File)` that:
     - Validates `file.type.startsWith('image/')` (allow png/jpg/gif/webp/svg).
     - Calls `uploadCourseAsset(file, \`body-images/${lesson.id}\`)` to upload to the existing `course-assets` bucket.
     - Inserts `![](publicUrl)\n` at cursor on success.
     - Shows a small "Uploading image…" toast / inline status.
   - Wire three entry points on the Textarea:
     - `onPaste` — iterate `e.clipboardData.items`, for any `kind === 'file'` image, `preventDefault()` and upload.
     - `onDrop` + `onDragOver` — accept dropped image files, upload each.
     - A small toolbar above the textarea with an "Insert image" `<label>` wrapping a hidden `<input type="file" accept="image/*" multiple>`.
   - Update the field label to: `Body (Markdown) — paste, drop, or upload images`.

2. **No DB / storage changes** — reuses the existing `course-assets` bucket (already public, already used for cover/video uploads) and the existing `uploadCourseAsset` helper in `src/hooks/useCourseAdmin.ts`.

3. **No renderer changes** — `CoursePage.tsx` already uses `ReactMarkdown` with `remarkGfm` + `rehypeRaw`, which renders standard markdown images and HTML `<img>` tags.

### Verification

- In an existing lesson, paste a screenshot into the Body textarea → markdown `![](https://…course-assets/body-images/…)` appears at cursor, and the image renders on the course page after save.
- Drag-drop a PNG onto the textarea → same result.
- Click "Insert image", pick a file → same result.
- Existing markdown bodies (no images) continue to render unchanged.

### Out of scope

- No rich-text WYSIWYG editor swap — keeps the current markdown textarea.
- No image resize / crop UI.
- No per-image alt-text prompt (authors can edit the `![alt](url)` inline; we can add a prompt later if requested).
