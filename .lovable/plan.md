## Problem

When the assistant returns a strategy, the chat bubble currently renders the entire message body through ReactMarkdown — including a large ```json ... ``` code block containing the structured plan. The result is a wall of raw JSON that's hard to read, with no visual hierarchy, no bold/bullets in the right spots, and the curated step titles + instructions get buried.

The plan data itself is already clean (curated titles, summary, steps, expected_result, before_you_start, risks, advisor_packet, render_blocks). We just need to render it properly.

## Goal

When an assistant message contains a v1 plan JSON block, hide the raw JSON and render a human-friendly **StrategyPlanCard** above any remaining prose. Keep the existing Save Plan button. No backend or schema changes.

## Scope

Frontend only:
- `src/components/assistant/MessageBubble.tsx` (wire in the new card; strip the JSON block from the markdown body)
- `src/components/assistant/StrategyPlanCard.tsx` (new — presentation component)
- `src/lib/strategyParser.ts` (small addition: also expose `render_blocks` and the raw plan so the card can use the headline/quick_win/checklist/risk_alerts)

No changes to `usePlans`, the edge function, or saved-plan rendering.

## StrategyPlanCard layout

Built with existing shadcn primitives (Card, Badge, Separator, Collapsible) and lucide icons. All colors via semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary/10`, etc.) — no hard-coded colors.

```text
┌─ Card ─────────────────────────────────────────────┐
│ [Horseman badge(s)]  [Strategy ID badge]           │
│ Headline (text-lg font-semibold)                    │
│ Summary paragraph (text-sm text-muted-foreground)   │
│                                                     │
│ ┌─ Quick win pill ──────────────────────────────┐  │
│ │ ⚡ $X-$Y • first win in 14–30 days            │  │
│ └────────────────────────────────────────────────┘  │
│                                                     │
│ Steps (h4: "Your plan")                             │
│  1. **Step title** (font-semibold)                  │
│     Instruction sentence (text-sm)                  │
│     ⏱ time_estimate   ✓ Done when: …               │
│  2. …                                               │
│                                                     │
│ ▸ Before you start  (Collapsible, bullet list)      │
│ ▸ Watch out for     (Collapsible, bullet list of    │
│                      risk_alerts/risks_and_mistakes)│
│ ▸ Bring to your advisor (Collapsible, bullets)      │
│                                                     │
│ Disclaimer (text-xs text-muted-foreground italic)   │
└─────────────────────────────────────────────────────┘
[Save Plan button — unchanged]
```

Behavior:
- Headline source priority: `render_blocks.headline` → `strategy_name`.
- Quick-win pill source: `render_blocks.quick_win` → derived from `expected_result`.
- Step rendering uses the existing `StructuredPlanStep` shape (title / instruction / time_estimate / done_definition). Strip stray `**` from any field (same `cleanStepText` pattern as `PlanChecklist`).
- Risk section prefers `render_blocks.risk_alerts` (top 2), falls back to first 3 of `risks_and_mistakes_to_avoid`.
- Collapsible sections default closed except Steps; bullets via standard `<ul class="list-disc pl-5 space-y-1">` so they look right in both themes.
- Mobile-friendly: `min-w-0`, `break-words`, no fixed widths.

## strategyParser.ts changes

`parseStrategyFromMessage` already returns the v1 plan content. Add two small things to the returned object (non-breaking):
- `renderBlocks?: { headline?, quick_win?, checklist?, risk_alerts? }` taken from `parsed.render_blocks`.
- `strategyId` already present.

No legacy-path changes.

## MessageBubble.tsx changes

1. After parsing, compute `cleanedContent` = `message.content` with the first ```json ... ``` block removed (only when `parsedStrategy` is non-null and the JSON parsed as v1). Trim resulting blank lines.
2. Render order inside the assistant bubble:
   - If `parsedStrategy` → `<StrategyPlanCard plan={parsedStrategy} />`
   - If `cleanedContent.trim()` non-empty → existing ReactMarkdown block, fed `cleanedContent` instead of `message.content` (keeps any intro/outro prose the model wrote).
   - Existing Save Plan button block (unchanged).
3. Widen the assistant bubble for plan messages: when `parsedStrategy` is present, use `max-w-[92%]` instead of `max-w-[80%]` so the card has room to breathe; keep `bg-muted` wrapper.

## Acceptance

- An assistant message containing a v1 plan JSON block shows the structured card with: horseman badge, headline, summary, quick-win pill, numbered steps with bold titles + instruction + time + done-when, and the three collapsible sections.
- The raw ```json``` block is no longer visible in chat.
- Save Plan button still appears and saves the same `PlanContent`.
- Non-plan assistant messages render exactly as today.
- Looks correct in light and dark mode at 375px and 1211px widths.

## Out of scope

- Edge function / curated banks / JSON schema (already addressed in prior loops).
- Saved Plan detail page rendering (`PlanChecklist` already handles structured steps).
- Telemetry / scoring.

## Files changed

- `src/components/assistant/StrategyPlanCard.tsx` (new)
- `src/components/assistant/MessageBubble.tsx` (edit)
- `src/lib/strategyParser.ts` (edit — additive only)
