# Fix iframe embed sizing (no more giant empty steps)

## Root cause

Every step container uses Tailwind `min-h-screen` (= 100vh). When embedded in an iframe:
- 100vh equals the iframe's own current height
- We post that height to the parent, parent grows the iframe
- Next step's `min-h-screen` now equals the new (larger) height — content never shrinks back
- Steps with little content (like Step 2) render as a tall empty box

## Fix

Add an "embedded" mode that:

1. **Detects iframe context** in `src/pages/HealthAssessment.tsx`
   - `const embedded = window.parent !== window || new URLSearchParams(location.search).has('embed')`
   - Add an `embed` class to `document.documentElement` on mount, remove on unmount

2. **Neutralize `min-h-screen` only when embedded** in `src/index.css`
   ```css
   html.embed .min-h-screen { min-height: 0 !important; }
   html.embed body { background: transparent; }
   ```
   This keeps the standalone page unchanged but lets the iframe collapse to actual content height.

3. **Measure a stable wrapper, not `document.body`**
   - Wrap the page contents in a `<div ref={rootRef}>` and observe that element with `ResizeObserver`
   - Post `rootRef.current.getBoundingClientRect().height` (rounded up)
   - Debounce with `requestAnimationFrame` to avoid feedback loops

4. **Reset scroll on step change** so the parent receives the smaller measurement immediately:
   - On `currentStep` change, set the wrapper to `height: auto` for one frame, then re-measure.

## GHL snippet stays the same

The existing iframe + `postMessage` listener in GHL doesn't change. Optionally append `?embed=1` to the src for explicit opt-in:

```html
<iframe id="rprx-health"
  src="https://app.rprx4life.com/health-assessment?embed=1"
  ...></iframe>
```

## Files touched

- `src/pages/HealthAssessment.tsx` — embed detection, ref-based measurement, html class toggle
- `src/index.css` — `.embed` overrides for `min-h-screen` and background

After this, you publish once and the GHL embed will resize cleanly between steps.
