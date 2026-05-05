# Strategy Assistant → Implementation Plan: World-Class Upgrade

Status: Parts 1, 2, 3, 5, 6 shipped. Part 4 (per-step Mark-done, Continue plan link, advisor packet actions) remaining.

Goal: every paid request returns up to 3 ranked, structured strategies that render as save-ready plan cards with a clear path to implementation. Free tier returns 1 reliable templated plan. Everything is observable and admin-tunable.

## Part 1 — Lock the contract (reliability)

1. **Force `STRICT_JSON_V1=true`** in `rprx-chat`. Paid path always calls OpenAI with `response_format: json_object` and a schema-pinned system prompt.
2. **Pure parser.** `strategyParser.ts`: keep only the JSON-block branch. Require `plan_schema: "v1"` and non-empty `steps[]`. Delete the legacy regex/marker-phrase fallback.
3. **One repair retry.** If first response fails schema validation, re-call once with "Return JSON only matching this schema" + the validation error. If still bad, return a friendly fallback card built from the catalog row (title, summary, 3 generic steps, disclaimer) — never a raw error.
4. **Server-side schema guard** before sending to client: validate with a small zod-like check; log failures to `plan_generation_events` with `parser_path` = `strict|repair|fallback`.

## Part 2 — Single-call multi-plan ("Auto" mode)

1. Replace the current 2-call auto-flow with **one** OpenAI call returning a `v1-multi` envelope:
   ```
   { plan_schema: "v1-multi", overview_md: "...", plans: [v1, v1, v1] }
   ```
2. `MessageBubble` renders the overview markdown + up to 3 `StrategyPlanCard`s, each with its own Save/Activate buttons.
3. Remove the auto-fired second user message in `ChatThread`.
4. Cards are collapsible; first card expanded by default, Quick Win chip + first step visible.

## Part 3 — Make the engine admin-tunable

Wire `prompt_engine_config` (already exists, admin-RLS) into `rprx-chat` with a 60s in-memory cache:
- ranker weights (horseman/goal/urgency/feasibility/impact/active-penalty)
- model, temperature, max strategies (default 3)
- system-prompt tone block + disclaimer
- diversification toggle (prefer one strategy per distinct horseman when top scores within 10%)
- anti-repetition window (penalize last N `plan_generation_events` strategy_ids)

Add a small admin tab `Assistant Engine` to edit these (read/write the existing table).

## Part 4 — Card → Implementation UX

In `StrategyPlanCard` + `SavePlanButton`:
- Quick Win chip, "~Xh effort", impact range, complexity dots in header.
- Per-step "Mark done" checkbox; persists to `saved_plans.completed_steps` if a saved plan exists for that `strategy_id`.
- "Continue plan →" link when a `saved_plans` row already matches `strategy_id` (jumps to `PlanDetail`).
- Advisor packet rendered as actionable buttons (Copy questions, Email advisor, Schedule) using existing `useAdvisorLink`.
- Risks/mistakes shown as an alert strip.

## Part 5 — Observability ("Assistant Quality" admin tab)

Off existing `plan_generation_events`:
- parser-path distribution (strict / repair / fallback / template)
- p50/p95 latency, token usage, cost
- step-count + advisor-packet presence rates
- per-strategy save-rate and activate-rate funnel
- top failing schema fields (last 7 days)

## Part 6 — Cleanup

- Delete legacy regex parser branch + `PLAN_MARKER_PHRASE`.
- Remove the `parseStrategyFromMessage(content, true)` lenient path and the `buildFallbackPlan` branch in `MessageBubble` once Parts 1–2 ship.
- Update `guards_test.ts` with strict-mode + multi-envelope cases.

## Technical notes

- Files touched: `supabase/functions/rprx-chat/index.ts`, `supabase/functions/rprx-chat/guards_test.ts`, `src/lib/strategyParser.ts`, `src/components/assistant/MessageBubble.tsx`, `src/components/assistant/ChatThread.tsx`, `src/components/assistant/StrategyPlanCard.tsx`, `src/components/plans/SavePlanButton.tsx`, `src/hooks/useSendMessage.ts` (envelope handling), new `src/components/admin/AssistantEngineTab.tsx` + `AssistantQualityTab.tsx`, `src/pages/AdminPanel.tsx`.
- DB: no new tables. Use `prompt_engine_config` and `plan_generation_events` as-is. Add 1–2 indexes on `plan_generation_events(created_at)` and `(strategy_id)` if missing.
- Backwards-compat: keep `v1` single-plan envelope working; `v1-multi` is additive.

## Suggested ship order

1. Parts 1 + 6 (parser + strict mode + cleanup) — foundation, low risk.
2. Part 2 (single-call multi) — biggest UX win.
3. Part 4 (card polish) — conversion win.
4. Part 3 (admin engine tab) — operator control.
5. Part 5 (quality tab) — measure & iterate.
