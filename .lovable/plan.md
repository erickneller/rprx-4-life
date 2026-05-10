# Strategy Assistant — Make It Respond to the Typed Request

## What's happening today

I traced a real example from the logs and DB:

- User typed: **"set up a business"**
- Edge log: `prompt_horseman_reason: none:{"interest":0,"taxes":0,"insurance":0,"education":0}`
- Result: 3 debt-payoff plans (`int_topic_assets`, `int_balance_transfer`, …)

The assistant returned debt strategies because the user's message contained zero of the hard-coded keywords in `detectPromptHorseman()`, so the router silently fell back to the assessment's primary horseman (`interest`). The user's actual request was ignored.

## Root causes (in `supabase/functions/rprx-chat/index.ts`)

1. **Intent detection is pure regex.** `detectPromptHorseman` only scores the four horseman buckets (interest / taxes / insurance / education) against a fixed keyword list. Anything outside that vocabulary — "start a business", "save for a house", "should I buy a car", "build an emergency fund", "increase my income" — scores 0 and is treated as "no intent".

2. **Silent fallback to assessment.** When prompt intent is `none`, `routingPrimaryHorseman` collapses to the assessment's `primary_horseman`. The user gets the same answer no matter what they typed.

3. **Strategy is locked before the LLM sees the message.** In `paid-openai-strict-json` the top-ranked strategy is injected as a `LOCKED STRATEGY (DO NOT CHANGE)` block. Even GPT-4o-mini can't correct course when the rank is wrong, because the contract forces it to write the locked plan.

4. **No semantic match against the catalog.** 478 strategies exist, but ranking only uses horseman bucket + goal tags + difficulty. The user's literal words are never compared to strategy `title` / `strategy_details`.

5. **Always 3 plans, never a conversation.** The output contract is `v1-multi` with 3 plans, so even a question like "how do I set up a business?" comes back as three pre-baked plan cards instead of an answer.

## Proposed improvements

### A. Replace regex intent with a small LLM intent step (paid tier) + heuristic boost (free tier)

Add a fast pre-pass (gpt-4o-mini, ~1 short call, JSON-only) before ranking:

```text
Input:  user_message + last 4 messages + horseman list + top-level catalog topics
Output: {
  intent: "strategy_request" | "question" | "intake_followup" | "out_of_scope",
  horseman: "interest" | "taxes" | "insurance" | "education" | null,
  query_terms: ["business formation", "S-corp", "self-employment tax"],
  user_goal_summary: "Wants to start a business and lower tax burden"
}
```

- If `horseman` is null AND `intent === "question"`, skip the locked-plan path entirely and answer conversationally.
- If `horseman` is set, use it as the primary routing signal — assessment becomes a tiebreaker, not the default.

Free tier keeps the regex but expands keywords for common adjacent intents (business / LLC / S-corp → taxes; house / mortgage / down payment → interest; emergency fund / savings → interest; raise / income / side hustle → taxes).

### B. Add lexical match against the catalog to ranking

In `scoreStrategy`, add a 6th component (max ~25 pts):

- Tokenize the user message, drop stopwords.
- Score overlap with `title` + `strategy_details` + `goal_tags` of each strategy.
- This lets a query like "balance transfer" surface `int_balance_transfer` even when horseman tied.

### C. Loosen the "LOCKED STRATEGY" contract

Two modes instead of one:

1. **Locked mode** — only when the user explicitly accepted a strategy or clicked a CTA that passes `auto=1`.
2. **Candidate mode** (new default for free-typed messages) — pass top 3-5 ranked candidates to the LLM with: "Pick the single best one for this exact request, or say none fit and answer conversationally." The contract still requires `strategy_id` to come from the candidate list, so we keep DB consistency, but the LLM can reject a bad rank.

### D. Conversational fallback when no strategy fits

When intent classifier returns `out_of_scope` or no candidate scores above a floor (e.g. 30):

- Skip the multi-plan JSON contract.
- Return a short markdown answer that (a) acknowledges the request, (b) maps it to the closest horseman if any, (c) offers 1-2 adjacent strategies as suggestions, (d) asks a clarifying question.

### E. Acknowledge the typed message in every response

Even in locked mode, prepend a one-sentence "You asked about X — here's the best fit" line so the user can tell the assistant heard them. This is a small `overview_md` change in the JSON contract.

### F. Telemetry

Add structured logs that make this debuggable:

```text
intent_classifier | user_msg_preview="set up a business" | classified_intent=question | classified_horseman=taxes | candidates=[tax_business_entity, tax_se_health, ...] | selected=tax_business_entity | route=candidate-mode
```

Right now the only log is `prompt_horseman_reason: none:{...}` which hides the failure.

## Scope of changes

| File | Change |
|---|---|
| `supabase/functions/rprx-chat/index.ts` | Add `classifyUserIntent()` (LLM call, paid only), expand `detectPromptHorseman` keywords (free), add lexical-match score in `scoreStrategy`, split `paid-openai-strict-json` into `locked` vs `candidate` sub-branches, add conversational-fallback path when no strategy clears floor, prepend acknowledgment to `overview_md`, add structured telemetry |
| `src/components/assistant/MessageBubble.tsx` | No change — already renders both prose and structured plans |
| `src/lib/strategyParser.ts` | Verify it still parses the new conversational responses (no JSON block) — likely already does, but worth a read |

## Out of scope (ask before doing)

- Vector embeddings on the catalog (would solve C/B more cleanly but needs schema + sync work).
- Replacing GPT-4o-mini with a larger model.
- Changing the multi-plan UI cards.

## Validation after build

1. Manually send: "set up a business" → expect taxes-bucket strategy + acknowledgment, not debt plans.
2. "how do I lower my insurance premium" → insurance horseman, not assessment fallback.
3. "what's the weather" → conversational out-of-scope reply, no plan card.
4. "show me debt strategies" → existing manual paginated flow still works.
5. Check `branch=` and new `intent_classifier` logs for each.
