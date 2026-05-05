# Why the text is cut off

The screenshot shows an alternate strategy card (Option 3) whose summary ends mid-sentence with "...". That's not a CSS clip — it's the **text itself** that has been truncated server-side before it ever reached the UI.

In `supabase/functions/rprx-chat/index.ts`, every plan (primary and alternate) runs through `normalizePlanReadability()`:

```ts
let summary = trimSummary(plan.summary || '');     // forces max 2 sentences, ~24 words/sentence
if (summaryNeedsFallback(summary)) {
  summary = buildDeterministicSummary(plan);
} else if (summary.length > 260) {
  summary = summary.slice(0, 257).replace(/\s+\S*$/, '') + '...';   // ← the literal "..."
}
```

For deterministic alternates the source `summary` is built in `buildStructuredPlan` from the catalog row's details/example/savings (line ~668: `.slice(0, 700)`). When `trimSummary` keeps two long sentences and the result still exceeds 260 chars, the hard 257-char cut leaves a dangling "...that would" — exactly what's in the screenshot.

The frontend (`StrategyPlanCard`) only adds `break-words` / `leading-relaxed` and does not clamp lines, so this is purely a backend trimming artifact.

## Plan

Tighten the summary builder so alternates don't ship dangling sentences.

### Backend — `supabase/functions/rprx-chat/index.ts`

1. **Drop the "..." cliffhanger.** In `normalizePlanReadability`, replace the 257-char hard slice with a sentence-boundary cut: keep only complete sentences that fit under the cap; if none fit, fall back to `buildDeterministicSummary(plan)` (already grammatical and short).
2. **Lower the cap to ~220 chars** so two short sentences fit comfortably without forcing a mid-word cut.
3. **Apply the same rule inside `buildStructuredPlan`** before storing `summary` (replace `.slice(0, 700)` with a sentence-aware trim) so the input to `normalizePlanReadability` is already clean for both primary and alternate plans.
4. Redeploy `rprx-chat`.

### Verification

- Send a manual chat that triggers a `v1-multi` envelope with 3 plans.
- Confirm none of the 3 cards' summary ends in "..." or a dangling word.
- Spot-check a known-long catalog row (e.g. `tax_topic_accelerate` from the screenshot) — summary should end on a `.`/`!`/`?`.

### Out of scope

No UI changes — `StrategyPlanCard` already handles wrapping correctly; the fix is purely in the server-side summary normalizer.
