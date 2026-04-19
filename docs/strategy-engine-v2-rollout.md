# Strategy Engine V2 — Rollout & Rollback

## What changed

| Area | Before | After |
|------|--------|-------|
| Strategy source table | `strategy_definitions` (legacy) | `strategy_catalog_v2` (canonical) with legacy fallback |
| Output formatter | Generic block with `Horseman / Impact / Difficulty` line | Clean V2 output: `## Title`, body, `Potential benefit:`, then `Here are the step-by-step implementation plans` + numbered steps |
| Prompt config | Hard-coded in templates only | `prompt_engine_config` table with seeded `strategy_engine_v2_default` row (weights, output settings) |
| Prompt templates | Old | `system_prompt`, `auto_mode_instructions`, `manual_mode_instructions` rewritten for deterministic V2 |
| Admin import/export | Excludes V2 tables | Supports `strategy_catalog_v2` (upsert by `strategy_id`) and `prompt_engine_config` (upsert by `id`) |
| Force-deterministic toggle | n/a | `RPRX_FORCE_TEMPLATE_ENGINE=true` env var on `rprx-chat` forces deterministic template engine for ALL users |

Legacy `strategy_definitions` table is **NOT dropped**. `rprx-chat` falls back to it automatically if `strategy_catalog_v2` is empty or unreachable.

## Deployment order

1. **Run migration** (creates `strategy_catalog_v2`, `prompt_engine_config`, seeds default config, backfills v2 from legacy, updates 3 prompt template rows). Already executed.
2. **Edge function `rprx-chat`** auto-deploys with the new V2-aware fetcher and formatter.
3. **Edge function `admin-data-import`** auto-deploys with the new allowlist + per-table conflict key.
4. **Import canonical CSV** → Admin Panel → Data Export tab → click **Upload** next to **Strategy Catalog V2** → select `strategy_definitions_transformed_v3_canonical_only.csv` → mode **Upsert**.

## Test checklist

After step 4 above:

- [ ] Admin Panel → Data Export tab shows: **Strategy Catalog V2**, **Prompt Engine Config**, **Strategy Definitions (Legacy)**.
- [ ] Download `strategy_catalog_v2.csv` — row count matches your CSV.
- [ ] Open Strategy Assistant → from a fresh assessment auto-redirect:
  - [ ] Output renders `## <Strategy Title>` (NOT a `Strategy Topic / Strategy Details` block).
  - [ ] Contains the exact line `Here are the step-by-step implementation plans`.
  - [ ] Numbered steps appear below.
  - [ ] Save Plan button appears (marker phrase detection).
- [ ] In manual mode, ask "show me tax strategies":
  - [ ] Returns ranked list, completed strategies excluded, active strategies de-prioritized.
- [ ] Edge function logs (`rprx-chat`) show `Strategy source: strategy_catalog_v2 (N rows)`.
- [ ] Toggle `RPRX_FORCE_TEMPLATE_ENGINE=true` → paid users also get deterministic output. Set back to `false` (or unset) to restore OpenAI for paid tier.

## Rollback

If V2 needs to be disabled:

**Option A — Soft disable (instant, no code change):**
```sql
UPDATE public.strategy_catalog_v2 SET is_active = false;
```
`rprx-chat` will see zero v2 rows and automatically fall back to `strategy_definitions`.

**Option B — Hard rollback to a prior `rprx-chat` version:**
Redeploy the previous `supabase/functions/rprx-chat/index.ts` from git. The legacy table is untouched, so behavior reverts immediately.

**Option C — Revert prompt templates only:**
```sql
-- restore your previous prompt copies for these three IDs:
--   system_prompt, auto_mode_instructions, manual_mode_instructions
```

The legacy `strategy_definitions` table is preserved indefinitely. Do not drop it.

## Notes

- `prompt_engine_config` is seeded but not yet read by `rprx-chat` — current scoring weights remain hard-coded in the function. The table is in place so weights can be moved to data-driven config in a follow-up without another migration.
- Linter warnings reported during migration (public storage buckets, leaked-password protection) are pre-existing and unrelated to this migration.
