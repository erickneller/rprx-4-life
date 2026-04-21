

## Embed a YouTube video in the Product Info section

### What you'll see
The dark dashboard mockup with the blue play button gets replaced by your actual YouTube video. Visitors see the video thumbnail with YouTube's native play button; clicking it plays the video inline (no leaving the page). The "2-minute explainer" caption stays underneath.

### How it works
`src/components/landing/ProductDemo.tsx` currently renders a fake dashboard mockup + non-functional play button. I'll replace that block with a responsive 16:9 `<iframe>` pointing at the YouTube embed URL derived from your link.

- Extract the video ID from whatever format you paste (`watch?v=ID`, `youtu.be/ID`, or `/embed/ID`).
- Use `https://www.youtube.com/embed/{ID}` as the iframe `src`.
- Keep the rounded corners, shadow, and section header/caption exactly as they are now.
- Add `title`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`, and `allowFullScreen` for proper playback + a11y.
- Remove the now-unused `Play` icon and `Button` imports.

### Files touched
- `src/components/landing/ProductDemo.tsx`

### Out of scope
- No new dependencies, no admin-configurable video field (hard-coded URL — fastest path; we can promote it to a DB-managed setting later if you want non-devs to swap it).
- No changes to surrounding sections, pricing, or FAQ.

**Just reply with the YouTube link and I'll apply it.**

