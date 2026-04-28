## Plan: Clear all strategies for fresh import

### What gets deleted
- **All rows in `strategy_catalog_v2`** (the canonical strategy source for the chat engine)
- **All rows in `user_active_strategies`** (every user's currently-activated strategies)

### What stays untouched
- `strategy_definitions` (legacy fallback table) — preserved as safety net
- `saved_plans` — user-generated plan content stays
- `strategy_catalog_v2_backup_20260428` — existing backup remains for rollback
- All other config tables (prompts, knowledge base, etc.)

### Steps
1. Run a migration: 
   - `DELETE FROM public.user_active_strategies;`
   - `DELETE FROM public.strategy_catalog_v2;`
2. Confirm both row counts are 0.
3. You upload the new CSV via Admin Panel → Data Export tab → **Upload** next to **Strategy Catalog V2** (upsert mode, conflict key `strategy_id`).
4. Verify the row count matches your CSV after import.

### Heads-up
Until you import the new CSV, the chat engine will fall back to the legacy `strategy_definitions` table — so users can still get strategies during the gap.

### Rollback
If anything goes wrong, restore `strategy_catalog_v2` from `strategy_catalog_v2_backup_20260428` with a single insert. (User-active strategies cannot be auto-restored — let me know if you want a backup of those before deletion.)
