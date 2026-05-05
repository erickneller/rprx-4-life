# Embed Health Assessment in GoHighLevel

Add an auto-resizing iframe embed so the assessment grows with content (no inner scrollbar) when placed inside a GHL funnel/page.

## What to add in GHL

In your GHL funnel/page, add a **Custom JS / HTML** element and paste:

```html
<iframe
  id="rprx-health"
  src="https://app.rprx4life.com/health-assessment"
  title="RPRx Health Assessment"
  style="width:100%;border:0;display:block;min-height:800px;"
  scrolling="no"
  allow="clipboard-write"
></iframe>
<script>
  (function () {
    var frame = document.getElementById('rprx-health');
    window.addEventListener('message', function (e) {
      if (e.origin !== 'https://app.rprx4life.com') return;
      if (e.data && e.data.type === 'rprx:height' && typeof e.data.height === 'number') {
        frame.style.height = e.data.height + 'px';
      }
    });
  })();
</script>
```

## What I'll change in the app (one small file)

Add a tiny resize-reporter inside `src/pages/HealthAssessment.tsx` so the iframe parent receives height updates:

- On mount, on every step change, and on `ResizeObserver` ticks of `document.body`, call:
  `window.parent.postMessage({ type: 'rprx:height', height: document.body.scrollHeight }, '*')`
- Guarded with `if (window.parent !== window)` so it's a no-op outside an iframe.
- Cleans up the observer on unmount.

That's the only code change required — everything else (assessment flow, GHL webhook submission) already works.

## Notes

- Embed points to your custom domain `https://app.rprx4life.com/health-assessment` (Active).
- Starts at the welcome screen (default route).
- If you ever want to skip the welcome step, we can wire a `?start=1` query param later.
