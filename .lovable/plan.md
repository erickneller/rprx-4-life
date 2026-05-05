# Why you only see one strategy

Two independent things are pinning output to a single plan:

### 1. The multi-plan envelope only builds in **auto mode**
`supabase/functions/rprx-chat/index.ts` (line 2778) wraps `[primary, ...alternates]` into a `v1-multi` envelope only when `effectiveMode === 'auto'`. Auto mode is triggered by the `?auto=1` redirect from the assessment results page. Every message you type into the chat (`handleSendMessage` in `StrategyAssistant.tsx`) goes out **without** a `mode`, so the function defaults to `manual` and skips the multi-envelope branch entirely → exactly one card.

### 2. Even in auto mode, config caps it at 1
`prompt_engine_config.strategy_engine_v2_default.output` currently has:
```
auto_mode_results: 1
auto_mode_multi_plans: <unset>
manual_mode_results: 5
```
The envelope code reads `auto_mode_multi_plans ?? auto_mode_results ?? 3`, which evaluates to `1`, and the `if (maxPlans > 1)` guard then skips the envelope. So even auto mode would only return one card today.

---

## Plan

### A. Backend (`rprx-chat/index.ts`)
1. Build the `v1-multi` envelope in **manual mode** as well, not just auto. Read the cap from `manual_mode_multi_plans ?? manual_mode_results ?? 3` for manual, and `auto_mode_multi_plans ?? auto_mode_results ?? 3` for auto.
2. Keep the `diversify_horseman` rule and the dedupe-by-strategy_id logic exactly as-is.
3. Keep free tier behavior unchanged (free tier already runs the deterministic template branch and exits before this block — confirm and leave alone).

### B. Engine config (`prompt_engine_config`)
Update `strategy_engine_v2_default.output` via migration:
- `auto_mode_multi_plans: 3`
- `manual_mode_multi_plans: 3`
- Leave `auto_mode_results` / `manual_mode_results` as-is (they control ranker page size, not envelope size).

This gives all paid users 3 ranked cards per round-trip in both modes, tunable later from the Assistant Engine admin tab.

### C. Admin Engine tab
Add the two new fields (`auto_mode_multi_plans`, `manual_mode_multi_plans`) to `AssistantEngineTab.tsx` so admins can tune the cap without a migration.

### D. Verification
1. Send a manual chat message as a paid user → expect 3 `StrategyPlanCard`s with individual Save buttons and the "Create My Plan" footer hidden.
2. Send via `?auto=1` from results → same multi-card behavior.
3. Free tier → unchanged single templated plan.
4. Check `plan_generation_events` to confirm `step_count` and latency stay in line.

### Out of scope
- Free-tier multi (still 1 plan by design).
- Per-card "Continue plan" deep-link (Part 4 of the larger roadmap).
