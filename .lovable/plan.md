## Problem

The thumbnail uploaded in the admin Library is saved correctly, but on the published `/library` page it never renders. For YouTube/Loom/file videos, `src/pages/Library.tsx` immediately mounts `<VideoPlayer>` (iframe/video element), so `thumbnail_url` is only used in two narrow cases: locked tier cards, and unknown video sources. The poster image you uploaded is effectively dead code for playable videos.

## Fix

Use `thumbnail_url` as a **click-to-play poster** on Library cards. The video player only mounts after the user clicks the poster — which also means the iframe no longer loads on page load (faster Library, fewer YouTube requests).

### Changes

1. **`src/pages/Library.tsx`** (unlocked card branch, ~lines 171–202)
   - Track per-card "playing" state (`useState<Set<string>>` of video ids, or a single `playingId`).
   - If the card is not playing AND `video.thumbnail_url` exists: render the thumbnail inside an `AspectRatio` with a centered Play button overlay. Clicking it sets the card to playing and calls the existing `logVideoOpen(...)`.
   - If playing OR no thumbnail: render `<VideoPlayer>` as today (keeps current behavior when no thumbnail was uploaded).
   - Locked-tier branch is unchanged.

2. No DB, hook, or admin changes. `useLibrary`, `LibraryTab`, and the `course-assets` upload flow all stay as they are.

### Out of scope

- Course lesson thumbnails (separate component) — can be a follow-up if you want the same behavior there.
- Auto-generating thumbnails from video URLs.
