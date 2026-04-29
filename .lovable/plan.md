## Goal

Address the five "Next Priorities" for `rprx-chat` without touching unrelated UI or business logic.

## Scope

All work is in `supabase/functions/rprx-chat/` plus one small migration for telemetry RLS. No frontend changes except a tiny logging field surfaced by the existing response (already returned).

---

## 1. Step quality uplift (reduce scaffold repetition)

Problem: `buildHorsemanSpecificSteps` always returns the same 5 sentences with `${titleLow}` interpolated, so every interest plan reads the same. Also DB-step path uses fixed `time_estimate` ladder per index.

Changes in `buildStructuredPlan` / `buildHorsemanSpecificSteps`:
- Mine real strategy fields (`strategy_details`, `example`, `implementation_steps`, `tax_return_line_or_area`, `potential_savings_benefits`) to derive specific nouns: account names, form numbers, dollar thresholds, time horizons. Add a small `extractAnchors(s)` helper returning `{forms[], accounts[], thresholds[], dueDates[]}` via regex (e.g. `Form\s\d+[A-Z]?`, `IRC\s*§?\s*\d+`, `\$\d[\d,]*`, `\d+\s*(?:days|months|years)`).
- Rewrite the per-horseman step bank as **templates with anchor slots** (`{{form}}`, `{{account}}`, `{{threshold}}`). When an anchor is missing, fall back to a generic phrase but vary across steps so two consecutive plans don't read identically.
- For DB-provided steps, replace the fixed time-estimate ladder with a heuristic: short imperative → 15-20 min, multi-clause → 20-45 min, "review/meet/schedule" → 30-60 min.
- Add a `dedupeAdjacentTitles()` pass so no two step titles share their first 4 words.

## 2. Telemetry — `plan_generation_events`

Table already exists; no rows are written. Add:
- A migration to enable RLS + policy: insert allowed for authenticated user where `user_id = auth.uid()`, select restricted to admins.
- In the function, after `assistantMessage` is finalized and before the response, fire-and-forget insert of:
  - `user_id`, `conversation_id`
  - `chosen_strategy_id` = `selectedStrategyMetadata.selected_strategy_id`
  - `ranker_score` = `selectedStrategyMetadata.score`
  - `strategy_source` (`v2` / `v1` / `none`)
  - `parser_path` = `runtimeBranch`
  - `mode` = `effectiveMode`
  - `tier` = `userTier`
  - `step_count` (parsed from final JSON)
  - `latency_ms` = `Date.now() - startedAt` (add `startedAt` at top of handler)
- Use the service-role client so the insert succeeds even if a user RLS policy is restrictive.

## 3. KB relevance — section-based retrieval

Replace `fetchKnowledgeBase(serviceClient)` (dumps every active KB row) with `fetchScopedKnowledge(serviceClient, { horseman, strategy })`:
- Pull `id, name, content` for active rows.
- Split each row into `## ` / `### ` sections; score sections by token overlap with `{horseman, strategy.title, strategy.tax_return_line_or_area, strategy.goal_tags}`.
- Return the top 3 sections, capped at ~4 KB total, with the source name as a header. This shrinks prompt tokens and improves grounding.
- Falls back to current behavior (top-of-file blurb only) when no sections score above threshold.

## 4. Hard guard tests

Add Deno tests under `supabase/functions/rprx-chat/`:
- `guards_test.ts` — pure-function tests:
  - `isGenericTitle` rejects "Step 2", "Schedule a 30", "Action 1", accepts real titles.
  - `assertPlanMatchesStrategy` flags id / name / horseman drift.
  - `buildStructuredPlan` for each horseman returns ≥2 steps, all titles pass `!isGenericTitle`, ids/horseman match input.
  - `dedupeAdjacentTitles` enforced.
- `kb_retrieval_test.ts` — feed a fixture KB row and confirm scoping returns the right section for an interest vs taxes strategy.
- Wire into `supabase--test_edge_functions` so `code--exec` can run them locally.

These are run automatically before claiming done.

## 5. A/B groundwork (optional model tuning)

No model swap yet — only the plumbing so the next step is a one-line change:
- Read `RPRX_PAID_MODEL_VARIANT` env (`"a"` default, `"b"` opt-in). Map to two model ids (e.g. `gpt-5.2` vs `gpt-5.2-mini`) — actual ids confirmed with user before flipping.
- Stamp `model_variant` into the telemetry row and the console log.
- No UI surface; A/B is driven by env flag so it can be toggled per cohort later.

---

## Verification

1. `supabase--test_edge_functions` runs `guards_test.ts` and `kb_retrieval_test.ts` — must pass.
2. Deploy `rprx-chat` and run three live prompts (interest, taxes, education) via `supabase--curl_edge_functions`.
3. For each, confirm:
   - Strict JSON v1, locked id/name/horseman.
   - Step titles vary across the three responses (no carbon-copy scaffolds).
   - A row landed in `plan_generation_events` with non-null `latency_ms`, `parser_path`, `strategy_source`, `step_count`.
4. Check `supabase--edge_function_logs rprx-chat` for the new `model_variant=` field.

## Files to change

- `supabase/functions/rprx-chat/index.ts` — step builder, KB retrieval, telemetry insert, model variant flag, latency timer.
- `supabase/functions/rprx-chat/guards_test.ts` — new.
- `supabase/functions/rprx-chat/kb_retrieval_test.ts` — new.
- One migration: enable RLS + insert/select policies on `plan_generation_events`.

## Out of scope

- Actually picking the B model (needs your call on which model id).
- Any frontend changes — `useSendMessage` already forwards everything we need.
- Refactoring template-engine prose path beyond the step-quality fixes.
