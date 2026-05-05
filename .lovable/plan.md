# Fix: Education-only request returns mixed-horseman strategies

## Root cause

In `supabase/functions/rprx-chat/index.ts` two things combine to produce mixed results when the user asks "give me strategies to reduce education costs":

1. **Horseman filter is too narrow.** `requestedHorsemanFilter` is only set when the message also contains the literal word `strateg(y|ies)` plus a verb like show/list/give (lines 2274–2290). A natural phrase like "reduce education costs" / "lower tuition" / "save on college" does NOT trip the filter, so `strategiesForRanking` stays as the full catalog (all four horsemen).

2. **The v1-multi envelope actively diversifies away from the primary horseman.** In the multi-plan builder (lines 2790–2839), `diversify_horseman` defaults to `true`. After the primary education plan is chosen, the loop deliberately *skips* any further education strategies as long as a different-horseman alternate exists (line 2817). Result: card 1 = education, cards 2/3 = taxes/interest/insurance.

`detectPromptHorseman` already correctly classifies "reduce education costs" as `education` (line 180 keyword set), so the routing primary horseman is right — only the alternates are wrong.

## Fix

All changes confined to `supabase/functions/rprx-chat/index.ts` (backend / presentation glue). No DB or frontend changes.

### 1. Broaden horseman-intent detection so it triggers on natural phrasing

Replace the `looksLikeStrategyList` gate with a broader "intent" check that ALSO accepts reduce/lower/save/cut/optimize verbs paired with a horseman keyword.

```text
allow when message matches:
  - existing strategy-list pattern, OR
  - /\b(reduce|lower|cut|save\s+on|minimize|optimize|pay\s+down|pay\s+off|eliminate)\b/
    AND a horseman keyword (tax|insurance|education|tuition|college|debt|interest|loan|premium)
```

When `detectPromptHorseman` returns a horseman AND this broader intent matches, set `requestedHorsemanFilter` to that horseman. This makes "reduce education costs", "lower my insurance premiums", "pay down my debt" all pre-filter the catalog correctly.

### 2. Disable cross-horseman diversification when the user picked a horseman

In the v1-multi envelope block (lines 2790–2839):

- Compute `intentHorseman = requestedHorsemanFilter || promptHorseman.horseman`.
- If `intentHorseman` is set, force `diversify = false` AND additionally filter the alternate candidate loop to `r.strategy.horseman_type === intentHorseman`. If fewer than `maxPlans-1` in-horseman alternates exist, just return whatever is available (do NOT pad with other horsemen).
- Keep the existing `diversify_horseman` config behavior only for the no-intent case (assessment-driven auto suggestions where variety is helpful).

### 3. Logging

Add one line: `multi-plan envelope | intent_horseman=… | diversify=… | alternates_in_horseman=N | alternates_total=N` so we can verify in edge logs.

### 4. Redeploy

Redeploy `rprx-chat` and verify by sending "give me strategies to reduce education costs" — expect all 3 cards to be `horseman: "education"`.

## Out of scope

- No changes to the ranker scoring weights.
- No DB migration — `prompt_engine_config.diversify_horseman` stays as-is and still controls behavior for general/assessment-driven requests.
- No frontend changes; `StrategyPlanCard` already renders whatever the envelope contains.
