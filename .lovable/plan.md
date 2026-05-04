
# Strategy Assistant → Implementation Plan: Path to World-Class

## Where we are today

The pipeline already does a lot right:

- Single source of truth: `strategy_catalog_v2` (493 active), with integrity filter that excludes mis-tagged rows.
- Smart ranker (horseman fit, goal fit, urgency, feasibility, impact) with completed/active penalties.
- Strict structured plan schema `v1` with `expected_result`, `before_you_start`, `steps[{title, instruction, time_estimate, done_definition}]`, `risks_and_mistakes_to_avoid`, `advisor_packet`, `render_blocks`.
- `StrategyPlanCard` renders the schema cleanly with badges, numbered steps, and collapsible sections.
- Save Plan / Create Plan flow exists, plans become focus, strategy auto-activates.

## What's still holding it back

**1. JSON v1 is "preferred" but not enforced.** `STRICT_JSON_V1` env flag exists but isn't on. When the model returns prose-only or partial JSON, the parser silently drops to a fragile legacy regex path that needs the literal phrase *"Here are the step-by-step implementation plans"* and reconstructs steps from numbered lines. Result: inconsistent cards, missing `before_you_start` / `advisor_packet`, no `quick_win` chip.

**2. Auto-mode does two sequential AI calls.** `ChatThread` sends a follow-up *"Please provide the step-by-step implementation plans for all 3 strategies above"* after the first response. That doubles latency (~6–14 s extra), doubles cost, and the overview message is rendered raw above the real plan, which looks like duplicate content.

**3. Multi-strategy responses aren't first-class.** Auto-mode asks for 3 strategies but the parser + card handle exactly one plan. The other two strategies appear only as markdown prose with no card, no Save button, no activation path.

**4. No progress signal back into the chat.** Once a plan is saved, there is no badge in the assistant view ("Plan saved · 2 of 7 steps done"), no "Resume your active plan" prompt, and no link from the chat card to `/plans/:id`.

**5. Advisor handoff is a static list, not an action.** `advisor_packet` renders as a collapsed bullet list. There is no "Email this packet to my advisor" or "Copy packet" CTA, and no link to the configured advisor (we already have `useAdvisorLink`).

**6. `prompt_engine_config` is unused.** The table is in place with admin-friendly RLS but the edge function reads no rows from it. Tone, ranker weights, model variant, and step counts are still hard-coded in `index.ts`.

**7. No streaming + no skeleton of the card.** Users wait 8–20 s with only a spinning "Almost there…" message. The plan card pops in fully formed at the end. Streaming the markdown body and progressively filling the card would feel dramatically faster.

**8. No "tier-aware" depth.** Free vs paid both get the same plan length / advisor packet. Paid should get deeper plans + advisor email export; free should get a shorter "teaser" with an upgrade CTA.

**9. Strategy ranker doesn't diversify.** Top 3 in auto-mode can all be the same horseman with similar tactics. Need anti-repetition + cross-horseman diversification when scores are close.

**10. No telemetry on plan quality.** `plan_generation_events` is logged but there's no admin view of: parser path used (`v1` vs `legacy`), step count distribution, latency, ranker scores. Hard to know if changes regress quality.

---

## Proposed plan

### Part 1 — Lock the contract (highest leverage)

- Turn on `STRICT_JSON_V1=true`. Make the edge function:
  - Always include the JSON v1 block (already templated).
  - On parse failure, retry once with a "JSON only, no prose" repair prompt instead of returning prose.
  - Reject (and log) any response without `plan_schema: "v1"` and a non-empty `steps` array; return a friendly fallback card built from the chosen catalog row.
- Tighten `strategyParser.ts` to **only** trust the JSON block. Delete the legacy regex path entirely (after telemetry confirms <1% legacy hits over 7 days).

### Part 2 — Fix auto-mode in one round trip

- Change the prompt so the first auto-mode response returns:
  - One markdown overview comparing 3 ranked strategies (table format).
  - Three JSON v1 plans in a single ` ```json ` array under one envelope `{ "plan_schema": "v1-multi", "plans": [ ... ] }`.
- Remove the follow-up message in `ChatThread.tsx` (`autoFollowUpSent` block).
- Update parser to return `ParsedStrategy[]` and update `MessageBubble` to render up to 3 cards, each with its own Save/Activate button.
- Net effect: ~2× faster, ~50% cheaper, no duplicate overview message.

### Part 3 — Card upgrades for clarity

- Default-open the **first step** + **Quick Win** chip; keep the rest collapsible.
- Add per-step "Mark done" toggle that writes back to `saved_plans.content.completedSteps` if the plan is already saved.
- Add a "Continue plan →" link on the card when an existing `saved_plans` row matches `strategy_id`.
- Convert the "Bring to your advisor" section into an action panel: **Copy packet**, **Email to advisor** (uses `useAdvisorLink`), and **Schedule a call** (uses configured advisor URL).

### Part 4 — Wire `prompt_engine_config`

- Read the active config row at edge-function start. Surface in admin UI:
  - Ranker weights (horseman / goal / urgency / feasibility / impact).
  - Number of strategies (1 in manual, 3 in auto — make configurable).
  - Tone preset and disclaimer text.
  - Model + temperature.
- Cache for 60 s in the edge function to avoid hot-path DB reads.

### Part 5 — Tier-aware depth

- Free: 1 strategy, 4–6 steps, no advisor packet, upgrade CTA on the card.
- Paid: 3 strategies in auto-mode, full packet, "Email packet" enabled.
- Read tier from `get_subscription_tier(_user_id)` once per request.

### Part 6 — Diversification in the ranker

- After ranking, when top-3 scores are within 10% of each other, prefer one strategy per distinct horseman.
- Anti-repetition: penalize any strategy whose `strategy_id` was returned in the user's last 5 plan_generation_events.

### Part 7 — Progressive rendering

- Switch `rprx-chat` to streaming SSE. Stream the markdown overview first, then the JSON block.
- `ChatThread` shows a card skeleton with the chosen strategy title (pulled from the ranker step, not the model) the moment ranking finishes — typically <500 ms.

### Part 8 — Quality telemetry

- New admin tab "Assistant Quality":
  - 7/30-day chart of parser path (`v1` / `v1-multi` / `legacy` / `failed`).
  - p50/p95 latency and step-count distribution.
  - Top strategies returned vs activated (conversion rate per strategy).
- Backed by existing `plan_generation_events` plus two new columns: `parsed_ok bool`, `step_count_total int`.

---

## Technical notes

- All schema additions to `plan_generation_events` go via `supabase--migration`.
- `v1-multi` envelope keeps backward compat: a single-plan response is just `plans: [{...v1...}]`.
- Parser becomes pure: no regex fallbacks, no horseman keyword guessing — the JSON declares everything.
- Streaming requires moving from `serve` JSON response to `ReadableStream`; client uses `fetch` with `ReadableStreamDefaultReader` (no SDK change needed).

## Done when

- Auto-mode shows 1–3 strategy cards in a single AI call, no duplicate overview.
- 100% of assistant responses with a plan are parsed via JSON v1 (legacy parser removed).
- Each card has working Save / Continue / Email-advisor actions.
- Admins can change ranker weights, model, and strategy count from the UI without a deploy.
- Free vs Paid users see materially different depth.
- Admin can see parser success %, latency, and per-strategy activation rate.

## Out of scope for this plan

- Voice input / output.
- Multi-turn refinement beyond the existing chat.
- Recommending strategies that aren't in `strategy_catalog_v2` (no live web search).
- Migrating non-admin reads off the legacy `strategy_definitions` view (already a no-op view, can stay).
