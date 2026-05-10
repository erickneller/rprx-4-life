## Why "set up a business" returned near-identical plans

Confirmed from the live log (`tax_topic_account` selected, 2 alternates in horseman):

1. **Top pick is wrong.** `tax_topic_account` is *"Account for future taxes when there is a transfer of shares in the family business as part of a divorce settlement."* — it just happens to contain "business". A user typing "set up a business" expects entity formation (LLC / S‑corp), self‑employment tax, retirement plans for owners, startup‑cost deductions, business credits.

2. **The 3 plans look nearly identical because they are.** Once we lock to `taxes` horseman and rank by lexical match on the single token `["business"]`, the top results collapse into a cluster of *"Deduct business X / business taxpayers can…"* entries that all share `goal_tags=["Reduce Taxes"]` and very similar wording. There is no intra‑horseman diversification — the multi‑plan envelope only diversifies *across* horsemen, and that's disabled when intent is set.

3. **Lexical match is too shallow.** `tokenizeQuery("set up a business")` → `["business"]` after stopwords. "Set up" is dropped, so the ranker can't tell apart *forming* a business from *deducting business expenses inside an existing one*.

## Proposed fix (scoped, no schema changes)

### A. Smarter lexical signal for "set up a business" class of intents
In `supabase/functions/rprx-chat/index.ts`:

- Keep stopwords, but add a small **phrase‑intent boost** that runs before tokenization:
  - `set up | start | starting | open | launch | form | forming | incorporate | register + business|company|llc|s-corp|s corp|c-corp|sole prop|self-employed|freelance` → boost intent tokens `["llc", "s-corp", "self-employment", "entity", "startup", "schedule c", "sep ira", "solo 401k", "business credit"]`.
  - Same pattern for adjacent intents already partially handled (house, car, emergency fund, raise) — make them additive boosts rather than only horseman hints.
- Score each candidate against the boosted token set so `tax_topic_account` (divorce/share transfer) loses to entity‑formation, SE‑tax, and retirement‑plan strategies.

### B. Intra‑horseman diversification in the multi‑plan envelope
Around lines 2854‑2882:

- When `intentHorseman` is set (so cross‑horseman diversification is off), add a **topic key** per candidate built from:
  - first content word of `title` after a verb (e.g. "Deduct", "Claim", "Establish", "Use") → group by *what the strategy does* (deduction vs credit vs entity choice vs retirement plan)
  - plus a coarse bucket inferred from keywords in `title`+`strategy_details`: `entity_formation`, `retirement_plan`, `deduction`, `credit`, `expense_reimbursement`, `payroll_tax`, `other`.
- While picking alternates, skip a candidate whose topic key matches the primary or any already‑picked alternate, *unless* we run out of distinct topics.
- Result: the 3 plans cover different *kinds* of tax strategies for the user's intent instead of three "deduct business X" cards.

### C. Acknowledgment line shows what we matched
Already present, but extend the ack to surface the matched concept words:
> *"You asked about: 'set up a business' — matched **entity formation, self‑employment, retirement plan**. Top 3 tax strategies that fit."*

This makes a wrong match obvious to the user instead of hiding it.

### D. Telemetry
Extend the existing `intent_classifier` log with:
- `boosted_tokens=[…]`
- `topic_keys_picked=[entity_formation, retirement_plan, credit]`
- `rejected_for_topic_dup=[strategy_id, …]`

So the next time we see "near‑identical plans" we can confirm in one log line whether diversification kicked in.

## Out of scope
- Vector embeddings on the catalog (cleaner long‑term fix, needs schema + sync).
- Reclassifying mis‑bucketed strategies (already excluded by the integrity check).
- Changing the multi‑plan UI cards.

## Files touched
- `supabase/functions/rprx-chat/index.ts` only.

## Validation after build
1. "set up a business" → primary is an entity‑formation or SE strategy; alternates are from different topic buckets (e.g. retirement plan, business credit) — not three "deduct business X".
2. "save for a house" → still works, mortgage/HELOC variety.
3. "show me debt strategies" → unchanged manual paginated flow.
4. Check new telemetry fields populate.
