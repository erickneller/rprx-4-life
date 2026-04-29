## Goal

Stop relying on model/DB prose for step titles. Force every plan step to use a deterministic, curated, human-readable title chosen by horseman, with short verb-first instructions and a hardened summary + render_blocks. Apply to BOTH the auto/template path and the paid OpenAI strict-JSON path.

## Scope

- `supabase/functions/rprx-chat/index.ts` (logic + normalization)
- `supabase/functions/rprx-chat/guards_test.ts` (regression fixture + assertions)

No frontend, schema, or contract changes. JSON v1 schema, `strategy_id`, `strategy_name`, `horseman` integrity preserved.

## Implementation

### 1. Curated title banks (per horseman)

Add a constant `CURATED_STEP_TITLES` keyed by horseman with exactly 5 entries each:

- **education**: Gather 529 account records / Confirm beneficiary and eligibility / Estimate contribution impact / Submit plan election or update / Schedule annual progress review
- **taxes**: Gather tax documents / Verify eligibility thresholds / Estimate tax impact / File required changes / Schedule compliance review
- **interest**: List balances and APRs / Compare payoff/refi options / Choose lowest-cost path / Execute account changes / Track 90-day savings
- **insurance**: Collect policy declarations / Compare coverage and premiums / Select policy adjustments / Submit coverage updates / Review renewal readiness

A `pickCuratedTitles(horseman, n)` helper returns the first `n` titles (capped at 5). Unknown horseman → fall back to a generic 5-step "diagnose → plan → act → verify → review" bank.

### 2. Deterministic instruction templates

Add `CURATED_STEP_INSTRUCTIONS` parallel to the title bank — one short verb-first sentence per slot per horseman (≤160 chars). At render time, optionally append a single anchor token (form/account/threshold) extracted via existing `extractAnchors` if it's available and short. Never include `strategy_name` substring.

Each curated step also gets:
- `time_estimate` from existing heuristic (kept).
- `done_definition` from a parallel `CURATED_DONE` bank (≤140 chars, verb-first).

### 3. Title/instruction rewrite pass (both paths)

After the existing `normalizePlanReadability`, run a new `applyCuratedSteps(plan)` pass that:
- Determines `horseman` from `plan.horseman[0]` (lowercased).
- Replaces every `steps[i].title` with `pickCuratedTitles(horseman, steps.length)[i]` — unconditionally (per user decision).
- Replaces `steps[i].instruction` with the curated instruction (with optional anchor) if the original instruction (a) contains the full `strategy_name`, (b) ends with a stopword, (c) exceeds 160 chars, or (d) is shorter than 25 chars. Otherwise keep the cleaned original.
- Replaces `steps[i].done_definition` from the curated bank if missing or contains `strategy_name`.
- Caps `steps.length` to 5 and pads to a minimum of 4 by drawing from the curated bank.

Wired into BOTH:
- The auto/template `buildStructuredPlan` return path
- The paid OpenAI strict-JSON path immediately after JSON parse + existing readability normalization

### 4. Summary hardening

Strengthen `normalizeSummary`:
- Already runs `repairSentenceMerges`; add: collapse to ≤2 sentences and ≤260 chars total.
- If after repair the summary still trips the merge regex `\.\s+[a-z]` OR is empty/awkward (single fragment, no verb), substitute deterministic fallback:
  - Sentence 1: `"This plan helps you ${horsemanVerbPhrase}."` (verb phrase per horseman: "lower your tax bill", "cut interest costs", "stretch your education savings", "right-size your insurance coverage").
  - Sentence 2: from `expected_result.impact_range` + `expected_result.timeframe` if present, else `"Most people see results within 30–90 days."`

### 5. render_blocks hard mode

`buildRenderBlocks(plan)` updated to:
- `headline`: ≤80 chars, plain-language verb phrase derived from horseman + (optional) the strategy's primary noun anchor (e.g. "Cut interest costs by moving balances to a lower-rate card"). If derivation overflows 80 chars, fall back to a fixed per-horseman headline.
- `checklist`: exactly the curated step titles used in `steps[]` (mirrors them 1:1, in order).
- `risk_alerts`: first 2 items from `risks_and_mistakes_to_avoid` (unchanged).
- `quick_win`: unchanged format.

### 6. Regression tests (`guards_test.ts`)

Add a fixture constant `BROKEN_EDUCATION_SAMPLE` capturing the current bad output (truncated titles like "Schedule a 30", strategy_name leak, ". assuming" merge). Then:

- `applyCuratedSteps(BROKEN_EDUCATION_SAMPLE)` produces:
  - Exactly the 5 curated education titles, in order.
  - No step title or instruction contains the `strategy_name` substring.
  - No title ends with a stopword (reuse `endsWithStopword`).
  - No title outside 4–10 words.
  - All instructions ≤160 chars and start with a verb.
- `render_blocks.checklist` deep-equals `steps.map(s => s.title)`.
- `render_blocks.headline.length <= 80`.
- `summary` does not match `/\.\s+[a-z]/` and is ≤260 chars / ≤2 sentences.
- A second fixture for taxes + interest verifies horseman routing picks the correct bank.

All 13 existing tests continue to pass.

## Verification

1. Run `supabase--test_edge_functions` against `rprx-chat/guards_test.ts` — must be green.
2. Deploy `rprx-chat` via `supabase--deploy_edge_functions`.
3. Live `supabase--curl_edge_functions` for an education prompt; capture the returned JSON and paste it into the final reply, confirming:
   - Clean 5-step checklist matching the curated education bank.
   - No repeated long phrase or strategy-name leak.
   - Headline ≤80 chars.
   - Summary ≤260 chars, no `. lowercase` merge.
4. Spot-check taxes + interest prompts to confirm bank routing.

Plan is not marked done without the education sample JSON in the final reply.

## Out of scope

- Ranking/business logic
- KB retrieval changes
- Telemetry schema (existing `plan_generation_events` insert remains as-is, `parser_path` will simply tag whichever branch executed)
- Frontend rendering

## Files changed

- `supabase/functions/rprx-chat/index.ts`
- `supabase/functions/rprx-chat/guards_test.ts`
