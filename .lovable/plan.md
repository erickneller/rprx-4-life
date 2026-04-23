

## Add Loom support to the shared video player

Extends the previously-approved GHL/YouTube plan to also accept Loom share links.

### What you'll see
Anywhere a video URL is accepted (admin **Library**, **Partners**, landing **Product Info**), you can paste:
- YouTube link → iframe embed
- Loom share link (`loom.com/share/{ID}`) → iframe embed
- Direct file (`.mp4`/`.webm`/`.mov`/`.m4v`/`.ogg`, including GHL Media Library URLs) → native HTML5 `<video>` player

Helper text under the admin "Video URL" field is updated to list all three.

### How it works

**`src/lib/videoSource.ts`** (new) — extends the planned helper:
```ts
export type VideoSource =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'loom';    embedUrl: string }
  | { kind: 'file';    src: string }
  | { kind: 'unknown' };
```
Loom detection: match `loom.com/share/{id}` or `loom.com/embed/{id}` and return `https://www.loom.com/embed/{id}`.

**`src/components/media/VideoPlayer.tsx`** (new) — YouTube and Loom both render via `<iframe>` (same `allow`/`allowFullScreen` attrs, 16:9 `AspectRatio` wrapper). File kind renders `<video controls preload="metadata">`.

**Refactor call sites** to use `<VideoPlayer />`:
- `src/pages/Library.tsx`
- `src/components/admin/LibraryTab.tsx` (relabel "YouTube URL" → "Video URL"; helper text: "YouTube, Loom, or direct .mp4/.webm URL (e.g. GHL Media Library)")
- `src/pages/Partners.tsx`
- `src/components/landing/ProductDemo.tsx`

**Deprecate** `toYouTubeEmbedUrl()` in `useLibrary.ts` / `usePartners.ts` — keep as thin re-exports of the new helper so existing imports don't break.

### Out of scope
- Password-protected Loom videos (no public embed available)
- Vimeo, Wistia, other providers (easy to add later in the same helper)
- DB schema changes — existing `video_url` text column accepts any URL
- GHL funnel pages and gated course videos (per prior decision)

### Files touched
- ➕ `src/lib/videoSource.ts`
- ➕ `src/components/media/VideoPlayer.tsx`
- ✏️ `src/pages/Library.tsx`
- ✏️ `src/components/admin/LibraryTab.tsx`
- ✏️ `src/pages/Partners.tsx`
- ✏️ `src/components/landing/ProductDemo.tsx`
- ✏️ `src/hooks/useLibrary.ts`
- ✏️ `src/hooks/usePartners.ts`

