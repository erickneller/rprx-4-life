## Diagnosis

The "How to use this custom GPT" lesson stores a valid Loom share URL (`https://www.loom.com/share/cf0d60d69760461bbed88b8bf62319b0`). `CoursePage.tsx` renders lesson videos via the legacy `VideoEmbed` component (line 204), not the unified `VideoPlayer`. When Loom's iframe fails to render (most common cause: the Loom video's privacy is set to "Only people invited" / workspace-only rather than "Anyone with the link"), `VideoEmbed` shows a bare broken embed with no explanation — which matches the screenshot.

Two things to fix together:

1. **Unify the player.** CoursePage still uses `VideoEmbed`, which is out of sync with the rest of the app. It doesn't share the richer `resolveVideoSource` logic or the standard aspect-ratio wrapper, so Loom (and other) URLs render inconsistently.
2. **Show a useful fallback.** When the embed can't render (blocked by Loom privacy, network error, unknown URL), the user should see a clear "Open in Loom / new tab" link instead of a broken icon.

## Plan

1. Replace `<VideoEmbed url={activeLesson.video_url} />` in `src/pages/CoursePage.tsx` with `<VideoPlayer url={activeLesson.video_url} title={activeLesson.title} />` so lessons use the same resolver as Library, Partners, Join, Custom Cards, and Help.
2. Enhance `src/components/media/VideoPlayer.tsx` to render an inline fallback whenever the iframe can't display content:
   - Detect iframe `onError` and a load timeout (~6s with no `onLoad`) → show a small overlay card with the video title and an "Open video in new tab ↗" button pointing at the original URL.
   - Keep the existing "Unsupported video URL" branch for `kind: 'unknown'`, but also include the same "Open in new tab" affordance so admins can still reach the source.
3. Remove `src/components/VideoEmbed.tsx` (no other callers after step 1) so there is a single video component in the codebase.
4. Verify by loading the affected lesson in preview — the Loom video should render, or, if Loom's privacy setting blocks embeds, the user will now see an "Open in Loom" link instead of a broken box.

## Action for you (likely root cause)

Open the Loom video in Loom → **Share settings** → confirm it's set to **"Anyone with the link can view"** and that **"Allow embedding"** is enabled. Workspace-only videos cannot be iframed on `app.rprx4life.com` regardless of code changes.

## Technical notes

- `VideoPlayer` already supports Loom via `resolveVideoSource` (`kind: 'loom'` → `https://www.loom.com/embed/{id}`), so no resolver change is needed.
- Iframe `onError` doesn't fire for cross-origin refusals in all browsers, hence the load-timeout backup.
- No DB or schema changes.