## Why raw HTML isn't rendering in course lessons

`ReactMarkdown` by default escapes raw HTML for safety — it shows the `<a href=...>` tags as literal text instead of rendering a link. To allow HTML inside markdown, the `rehype-raw` plugin must be added.

Also, for plain URLs without an anchor tag, `remark-gfm` (already enabled) auto-links them, but the author's intent here is a styled anchor with `target="_blank"`, which requires raw HTML support.

## Fix

1. **Install `rehype-raw`** via `bun add rehype-raw`.
2. **`src/pages/CoursePage.tsx`** — import `rehypeRaw` and pass `rehypePlugins={[rehypeRaw]}` to the lesson `<ReactMarkdown>` so inline HTML (`<a>`, `<br>`, `<strong>`, etc.) renders correctly.

### Markdown alternative (no code change needed)
The author can also use markdown link syntax instead of raw HTML:
```
[Access The Tax Scholarships Playbook](https://rprx4life.com/play-book-tax-scholarships)
```
This already works today and opens in the same tab. To force a new tab, raw HTML (fix above) is required.

### Out of scope
Extending `rehype-raw` to other markdown renderers (help guide, plans, assistant) — happy to apply the same treatment if desired, just say the word.

### Security note
`rehype-raw` allows authors to inject any HTML/JS. Since only admins author course content (gated by the Courses admin tab), this is acceptable. If we ever open authoring to end users, we should pair it with `rehype-sanitize`.
