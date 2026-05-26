## Why markdown isn't formatting in courses

Two technical issues are stacking, plus a content note:

1. **Typography plugin not registered.** `@tailwindcss/typography` is installed in `package.json` but missing from `tailwind.config.ts` → every `prose`/`prose-invert` class on the lesson body is a no-op, so headings/lists/bold render at base size with no spacing.
2. **Single line breaks are being collapsed.** `ReactMarkdown` follows CommonMark, where consecutive lines without a blank line between them merge into one paragraph. The lesson content in the screenshot uses single newlines between sentences, so they all collapse together visually.
3. **(Content note, not code)** Lines like "The Tax Scholarships Playbook" and "Welcome and Mindset Shift" have no `#`/`##` prefix, so even with markdown working they'll render as paragraphs, not headings. The author needs to add `#`/`##` in the lesson body for proper hierarchy.

## Fix

### 1. Register the typography plugin
`tailwind.config.ts` → add `require("@tailwindcss/typography")` to the `plugins` array.

### 2. Enable GFM + line-break handling in the lesson renderer
`src/pages/CoursePage.tsx` → install/use `remark-gfm` and `remark-breaks` so:
- Single newlines render as `<br>` (matches author intent in the screenshot)
- Tables, task lists, strikethrough work
- Autolinks work

```tsx
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
...
<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
  {activeLesson.body_markdown}
</ReactMarkdown>
```

Add `remark-gfm` and `remark-breaks` via `bun add`.

### Out of scope
- Editing existing lesson content to add `#` headings (author task).
- Changing markdown rendering elsewhere (`useUserGuide`, help page, plans). If you want consistent behavior there too, say the word and I'll extend the same plugins to those renderers.
