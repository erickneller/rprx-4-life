## Issue
All three returned strategy cards can display the same headline, **“Lower your tax bill with a few targeted moves”**, even when the underlying strategy IDs/topics differ.

## Root cause
The backend readability pass builds `render_blocks.headline` from the plan summary. When the summary is generic, long, or filtered out because it contains the strategy name, `buildHeadline()` falls back to a horseman-level default headline. Since all three business-startup results are in the Taxes horseman, all three cards receive the same fallback headline.

There is also a frontend contributing factor: `StrategyPlanCard` prioritizes `renderBlocks.headline` over the actual canonical `strategyName`, so the duplicate generic headline hides the real strategy title.

## Plan
1. **Make backend headlines strategy-specific**
   - Update `buildHeadline()` in `supabase/functions/rprx-chat/index.ts` so fallback headlines use the selected strategy’s canonical title, cleaned and shortened, instead of the broad horseman fallback.
   - Keep the existing generic horseman fallback only as a last resort when there is no usable strategy title.

2. **Make multi-plan serialization consistent**
   - Normalize the parsed primary plan again before adding it to the `v1-multi` envelope, so primary and alternate cards all receive the same improved headline logic.

3. **Add duplicate-headline protection in multi-plan envelopes**
   - Before serializing `plans: [...]`, detect repeated `render_blocks.headline` values.
   - If duplicates occur, replace those duplicate headlines with each plan’s cleaned `strategy_name`.

4. **Frontend guardrail**
   - In `StrategyPlanCard`, if `renderBlocks.headline` is missing, too generic, or identical across common fallback phrases, display `strategyName` instead.
   - This prevents future backend fallback text from masking distinct strategy cards.

5. **Verify**
   - Run the existing `rprx-chat` Edge Function tests.
   - Re-test the prompt “set up a business” and confirm the three cards show distinct labels tied to their real strategies, not the generic Taxes headline.