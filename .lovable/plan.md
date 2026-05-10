## What the user is seeing

Even though the log shows three distinct topic buckets (`retirement_plan`, `deduction_general`, `entity_formation`), the actual strategies returned for "set up a business" are all narrow tax tactics for an *already-existing* small business:

- **Primary:** `tax_topic_claim_5` — *"Claim a general business tax credit for the cost of establishing a new small employer pension plan."*
- **Alternates:** likely `tax_topic_establish` (set up retirement plans for owner & family) and `tax_c_corp_5` (S-corp status is attractive to start-ups) or similar.

To a real user typing "set up a business", these read as three slight variations on "set up a retirement plan inside your business" — the foundational entity-formation guidance they expected (LLC vs S-corp vs sole prop, EIN, Schedule C, startup deductions) never makes the top spot.

## Root causes

1. **Boost tokens are flat-weighted.** `phraseIntentBoosts` pushes `["llc","s-corp","entity","sole proprietor", … ,"retirement plan","employer","sep","solo 401","section 179"]` into the ranker with equal weight. Strategies that mention *several* retirement/pension/employer terms (very common in the catalog) score higher than a single clean entity-formation strategy.
2. **No intent → primary-topic enforcement.** Topic dedup runs only on alternates; the primary is whatever the lexical ranker picks. For "set up a business" we never require the #1 to come from the `entity_formation` (or new `business_basics`) bucket.
3. **Topic key for the primary was `retirement_plan`**, not `entity_formation`, even though the intent is clearly entity formation. The current bucket order in `strategyTopicKey` puts `entity_formation` first only if the strategy text matches LLC/S-corp/etc. — `tax_topic_claim_5` doesn't, so it falls into `retirement_plan`. Fine — but nothing pulled an entity-formation row to the top.
4. **Plans feel "identical" visually** because three picks all touch retirement plans / pension credits / S-corp tax election → similar tone, similar step language, all about "set up a plan and contribute".

## Proposed fix (edge function only, `supabase/functions/rprx-chat/index.ts`)

### A. Tier the boost tokens (primary vs context)
Change `phraseIntentBoosts` to return a structured object:
```ts
{ primary: ["llc","s-corp","s corporation","entity","sole proprietor","self-employment","incorporate","schedule c","startup"],
  context: ["sep","solo 401","retirement plan","employer","small business","business credit","section 179","depreciation"] }
```
Update `scoreStrategy`'s lexical-match component so a primary-token hit is worth ~3× a context-token hit (e.g. +9 vs +3, capped). This pulls genuine entity-formation strategies above pension-credit strategies for the "set up a business" class.

### B. Map intent → preferred primary topic; enforce on the locked strategy
Add a small map:
```ts
const INTENT_PRIMARY_TOPIC: Record<string, string[]> = {
  set_up_business: ['entity_formation','business_basics','retirement_plan'],
  buy_house:       ['mortgage','debt_paydown'],
  emergency_fund:  ['debt_paydown','health_account'],
  // …
};
```
After ranking, if the user's phrase intent is detected and the top ranked strategy's `strategyTopicKey` is *not* in the preferred list, walk down the ranked list and promote the first candidate whose topic key matches the highest-priority preferred bucket (and still exceeds a minimum score floor). This becomes the locked strategy ID handed to the LLM and the primary in the v1-multi envelope.

### C. Add a `business_basics` topic bucket
Extend `strategyTopicKey` so strategies mentioning *"start-up costs", "small business", "sole proprietor", "schedule c", "EIN", "self-employed"* without LLC/S-corp wording bucket into `business_basics` instead of falling through to `deduction_general`. This gives the diversifier a real third lane for this intent (entity_formation, business_basics, retirement_plan) so the three cards visibly differ.

### D. Primary-topic-aware alternate ordering
When `intentHorseman` is set AND we have a preferred topic list, sort candidates inside each pass by `(preferredTopicRank, score)` instead of pure score. Result: alternates fill the *next* preferred buckets in order, not just whatever distinct bucket happens to come up.

### E. Telemetry
Extend the existing `multi-plan envelope` log line with:
- `intent_label` (e.g. `set_up_business`)
- `preferred_topics=[entity_formation,business_basics,retirement_plan]`
- `primary_topic=<key>` and `primary_promoted=true|false` (whether step B replaced the lexical #1)

So a future regression is one log line away from being diagnosed.

### F. Acknowledgment line uses the matched topics in priority order
Already shows "Matched: retirement plan, deduction, entity formation". Reorder to reflect the *priority* (entity formation first), and only list buckets that actually appear in the picks.

## Out of scope

- Adding new rows to `strategy_catalog_v2` (e.g. a real "How to form an LLC" entry) — separate content task.
- Vector embeddings.
- Changes to the LLM strict-JSON prompt or UI cards.

## Validation after build

1. `"set up a business"` → primary topic = `entity_formation` or `business_basics`; the three cards visibly cover three different angles (e.g. choose entity → SEP/solo 401k → small employer pension credit).
2. `"buy a house"` → primary topic = `mortgage`.
3. `"show me debt strategies"` → unchanged (no phrase intent → no promotion).
4. New telemetry fields populate; `primary_promoted=true` appears for the business case.

## Files touched

- `supabase/functions/rprx-chat/index.ts` only.
