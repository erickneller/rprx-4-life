## Add Descript video support

Extend the video resolver and iframe allow-lists so Descript share links work everywhere YouTube/Loom/Vimeo do.

### Changes

1. **`src/lib/videoSource.ts`**
   - Add `descript` to the `VideoSource` union.
   - Add `getDescriptVideoId(url)` matching `share.descript.com/view/<id>` and `share.descript.com/embed/<id>` (also accepts `/view/<id>/<slug>`).
   - In `resolveVideoSource`, return `{ kind: 'descript', embedUrl: 'https://share.descript.com/embed/<id>' }`.
   - Update `toEmbedUrl` to include the descript case.

2. **`src/pages/CoursePage.tsx`**
   - Add a Descript regex alongside the YouTube/Vimeo/Loom branches so course videos resolve to the Descript embed URL.

3. **`src/components/help/PageHelpButton.tsx`**
   - Extend `isEmbeddableVideo` and the embed URL builder to recognize `share.descript.com` and produce the embed URL.

4. **`src/components/dashboard/CustomCard.tsx`**
   - Add `share.descript.com` (and `descript.com`) to `ALLOWED_IFRAME_HOSTS` so the sanitizer permits Descript iframes in custom cards.

5. **Copy updates** (small label text only)
   - `src/components/admin/course/CourseBuilder.tsx`: "YouTube, Vimeo, Loom, Descript, or MP4".
   - `src/components/admin/CustomCardDialog.tsx`: same — update both the label and the allow-list helper text.
   - `src/components/admin/PageHelpTab.tsx`: "YouTube, Vimeo, Loom, Descript, or direct video URL".

### Verification

- Paste a sample Descript URL (`https://share.descript.com/view/XXXXXXXX`) into a Custom Card video field and a Course lesson video field; confirm the player renders.
- Confirm existing YouTube/Loom/Vimeo/MP4 links still resolve unchanged.

### Out of scope

- No DB schema changes — the `video_url` columns already store free-form URLs.
- No thumbnail support for Descript (their share pages don't expose a stable thumbnail URL).