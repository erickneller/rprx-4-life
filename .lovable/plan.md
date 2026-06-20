# Fix: Thumbnail URLs not rendering in Library

## Why it's broken
You pasted a Google Drive `/file/d/{id}/view` URL into Thumbnail URL. That's a webpage URL, not an image URL — `<img src>` can't render it. Drive's image-hosting workarounds (`uc?export=view`) are unreliable and frequently blocked by CORS/hotlink protection, so they aren't a good fix either.

## Solution
Give admins a real place to host thumbnail images: a public Supabase Storage bucket plus an upload button in the Library admin form. The existing free-text URL field stays (for cases where you already have a hosted image), but the primary path becomes "upload a file".

## Changes

1. **Create storage bucket** `library-thumbnails` (public read, admin write) via `storage_create_bucket`, plus RLS policies on `storage.objects`:
   - Public SELECT on objects in this bucket
   - INSERT/UPDATE/DELETE restricted to users with the `admin` role (via existing `has_role` function)

2. **`src/components/admin/LibraryTab.tsx`** — in the video form (around line 201), add an "Upload image" button next to the Thumbnail URL input:
   - File picker (image/*)
   - Uploads to `library-thumbnails/{uuid}.{ext}`
   - On success, writes the public URL into `vidForm.thumbnail_url`
   - Shows a small preview thumbnail when a URL is present
   - Loading + error toast states

3. **Helpful hint text** under the input: "Paste a direct image URL or upload a file. Google Drive share links won't work."

No changes to `Library.tsx` rendering — it already uses `thumbnail_url` correctly.

## Out of scope
- Auto-converting Drive URLs (unreliable)
- Generating thumbnails from the video itself
- Migrating existing broken Drive URLs (you'll re-upload as needed)
