## Goal
Ensure every video player in the app can go fullscreen on the user's device (desktop + mobile, iOS included).

## Findings
- `src/components/media/VideoPlayer.tsx` (used by Library and dashboard CustomCard videos):
  - Iframe branch already sets `allowFullScreen`, but its `allow` string omits `fullscreen`. Some browsers (notably embedded YouTube/Loom in certain contexts) require `fullscreen` in the Permissions-Policy `allow` list in addition to the `allowfullscreen` attribute.
  - File branch uses native `<video controls>` but is missing `playsInline` — on iOS Safari this can force inline-only or block proper fullscreen toggling. Native controls already expose a fullscreen button; we just need to not suppress it (no `controlsList="nofullscreen"` present — good).
- `src/pages/CoursePage.tsx` `VideoEmbed`:
  - Iframe already has `allow="autoplay; fullscreen; picture-in-picture"` and `allowFullScreen` — OK.
  - Native `<video controls>` is missing `playsInline` (same iOS issue).
- `src/components/dashboard/CustomCard.tsx` embed (raw HTML) sanitizer already permits `allow` and `allowfullscreen` attributes, so admin-pasted embeds keep fullscreen if the source iframe includes them. No change required.

## Changes
1. `src/components/media/VideoPlayer.tsx`
   - Add `fullscreen` to the `IFRAME_ALLOW` permissions list (final value: `accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture`).
   - Keep `allowFullScreen` attribute on the iframe.
   - On the native `<video>` element, add `playsInline` so iOS allows user-initiated fullscreen via the default control bar.
2. `src/pages/CoursePage.tsx` (`VideoEmbed`)
   - Add `playsInline` to the fallback native `<video>` element.
   - Iframe already correct; no change.
3. No DB, RLS, or business-logic changes. Purely a presentation tweak.

## Verification
- Library page: open a YouTube/Loom/Vimeo video → fullscreen icon in player works; open an uploaded MP4 → native controls show fullscreen button on desktop and iOS.
- Course lesson: same checks on `VideoEmbed`.
- Dashboard custom video card: confirm fullscreen toggle.
