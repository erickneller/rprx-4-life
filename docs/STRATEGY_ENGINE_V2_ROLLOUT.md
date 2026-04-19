# Strategy Engine V2 Rollout

## What this migration introduces
- `strategy_catalog_v2`: canonical, cleaned strategy table for deterministic ranking/output.
- `prompt_engine_config`: versioned scoring/output config for the strategy engine.
- refreshed `prompt_templates` defaults for deterministic behavior.
- `rprx-chat` now reads from `strategy_catalog_v2` (with legacy fallback).
- admin import/export edge functions now support `strategy_catalog_v2` + `prompt_engine_config`.

## Deploy order
1. Apply DB migration:
   - `supabase/migrations/20260419195000_strategy_engine_v2.sql`
2. Deploy edge functions:
   - `rprx-chat`
   - `admin-data-import`
   - `admin-data-export`
3. Import canonical strategy file into `strategy_catalog_v2`:
   - `strategy_definitions_transformed_v3_canonical_only.csv`
   - mode: upsert
   - key: `strategy_id` (or include `id` = `strategy_id`)
4. Optional: import `prompt_engine_config` overrides if desired.
5. Set env secret in Supabase:
   - `RPRX_FORCE_TEMPLATE_ENGINE=true` (for deterministic runtime testing)
6. Smoke test in app:
   - Auto mode: single strategy output
   - Manual mode: ranked top strategies
   - Ensure completed strategies are excluded and active strategies are deprioritized

## Rollback
- Set `RPRX_FORCE_TEMPLATE_ENGINE=false` to return to prior paid-tier OpenAI behavior.
- `rprx-chat` includes fallback to `strategy_definitions` if `strategy_catalog_v2` is unavailable/empty.
- No destructive changes are applied to `strategy_definitions`.
