# Strategy Catalog Reconciliation + Admin Header Clarity

## Goal

1. Make `strategy_catalog_v2` the single source of truth (it has the richer schema: `implementation_steps`, `estimated_impact_min/max`, `time_to_impact`, `effort_level`, etc.).
2. Stop maintaining the legacy `strategy_definitions` mirror.
3. Fix the ambiguous admin header so 513 vs 493 vs "selected" is unmistakable.

Today both tables hold the same 513 rows / 493 active across the same 4 horsemen, but only `rprx-chat` reads `strategy_catalog_v2`. Every other surface (admin UI, activation card, scoring, plans, dashboards) still reads `strategy_definitions`. Any edit in the admin Strategies tab silently diverges the two.

---

## Part A — Reconcile to one catalog

### Approach: keep `strategy_catalog_v2` as canonical, expose `strategy_definitions` as a read-only compatibility view

This avoids touching `user_active_strategies.strategy_id` (text FK by id) and avoids rewriting every consumer at once.

### Step 1 — Database migration

- Verify parity one more time (id sets equal, horseman_type matches).
- Drop the legacy table `strategy_definitions`.
- Recreate `strategy_definitions` as a **VIEW** over `strategy_catalog_v2` exposing the legacy column shape consumers expect:
  - `id, name (=title), description (=strategy_details), horseman_type, difficulty, estimated_impact (=estimated_impact_display), steps (=implementation_steps), sort_order, is_active, tax_return_line_or_area, financial_goals (=who_best_for or [] cast), created_at`.
- Grant SELECT on the view to `authenticated`.
- Drop the existing INSERT/UPDATE/DELETE RLS policies on `strategy_definitions` (no longer applicable to a view).
- Backup table `strategy_catalog_v2_backup_20260428` is left alone.

Result: every existing read path keeps working unchanged. Writes through the legacy admin hooks will start failing — which is intentional and handled in Step 2.

### Step 2 — Repoint admin write path to v2

Update `src/hooks/useAdminStrategies.ts` and `src/components/admin/LibraryTab.tsx` (Strategies tab) so create/update/delete/import/bulk-toggle target `strategy_catalog_v2` directly using its real columns (`title`, `strategy_details`, `implementation_steps`, etc.).

Update `useAdminStrategies` reads to also pull from `strategy_catalog_v2` directly so the editor surfaces the richer fields (impact min/max, effort_level, time_to_impact, requires_advisor) that today's UI hides.

### Step 3 — Repoint chat engine fallback

In `supabase/functions/rprx-chat/index.ts`, drop the `ALLOW_LEGACY_FALLBACK` branch that reads `strategy_definitions`. With the view in place the fallback is now a no-op, but removing it eliminates dead code and the misleading log line. Keep `STRICT_JSON_V1` and other guards untouched.

### Step 4 — Update admin import/export catalog

- `supabase/functions/admin-data-export/index.ts` and `admin-data-import/index.ts`: remove `strategy_definitions` from the table list (it's a view now, not importable). Keep `strategy_catalog_v2`.
- `src/components/admin/DataExportTab.tsx`: remove the "Strategy Definitions (Legacy)" entry; relabel v2 as "Strategy Catalog".

### Step 5 — Leave non-admin reads alone (for now)

`StrategyActivationCard`, `MyStrategiesCard`, `DailyCheckIn`, `useRPRxScore`, `gamification.ts`, `SavePlanModal`, `autoStrategyGenerator` keep reading `strategy_definitions` — they now transparently read the view. A follow-up cleanup can migrate them to v2 directly to access richer fields, but it's not needed for correctness.

---

## Part B — Admin header clarity

In `src/pages/AdminPanel.tsx` Strategies tab header (where "All Active" toggle and "513 selected" appear):

- Always show three counts: **Total: 513 · Active: 493 · Selected: N**.
- Rename the "All Active" toggle label to **"Show only active"** (current label is ambiguous — it reads like a bulk action).
- When 0 selected, hide the "Selected" chip instead of showing "0 selected".
- Add a small subtitle under the tab title: "Source: strategy_catalog_v2".

Pure presentation change — no logic changes to selection or filtering.

---

## Technical notes

- The view approach means **no data migration / no row copying** — zero risk of drift during cutover.
- `user_active_strategies.strategy_id` is text and references ids that exist in both tables today; nothing to change.
- `src/integrations/supabase/types.ts` regenerates automatically after the migration — `strategy_definitions` will appear as a View instead of a Table, which TypeScript treats the same for `.select()`. Existing `.insert()/.update()/.delete()` calls against it will start failing typecheck — that's the signal to repoint them in Step 2.
- Hard-coded ranking weights in `rprx-chat` (`scoreStrategy`) and the unused `prompt_engine_config` are out of scope here — separate cleanup.

## Out of scope

- Wiring `prompt_engine_config` into the ranker.
- Auto-mode diversification / anti-repetition.
- Migrating non-admin consumers off the legacy column names.

## Done when

- `strategy_definitions` is a view; admin edits flow into `strategy_catalog_v2` and immediately reflect everywhere.
- Admin header shows Total / Active / Selected unambiguously.
- `rprx-chat` no longer references `strategy_definitions` or `ALLOW_LEGACY_FALLBACK`.
- Admin export/import lists only `strategy_catalog_v2` for strategies.
