

# Universal Data Export System

## Overview
Add a dedicated **Data Export** tab to the Admin Panel that lets admins download any database table as CSV with one click. Also add individual CSV export buttons to admin tabs that don't already have them.

## Approach

### 1. New admin component: `DataExportTab.tsx`
A single page listing all exportable tables, each with a "Download CSV" button. Tables grouped into two sections:

**Back Office / Configuration Data:**
- `strategy_definitions`
- `assessment_questions`
- `deep_dive_questions`
- `badge_definitions`
- `onboarding_content`
- `prompt_templates`
- `feature_flags`
- `page_help_content`
- `knowledge_base`
- `dashboard_card_config`
- `sidebar_nav_config`
- `activity_xp_config`
- `user_guide_sections`
- `partner_categories`
- `partners`
- `company_partner_visibility`

**User Data:**
- `profiles` (via `admin_list_users` RPC for full data)
- `user_assessments`
- `assessment_responses`
- `user_deep_dives`
- `user_active_strategies`
- `saved_plans`
- `user_badges`
- `user_activity_log`
- `user_onboarding_progress`
- `conversations` + `messages`
- `companies` + `company_members`
- `debt_journeys` + `user_debts` + `debt_payments`
- `page_feedback`
- `user_subscriptions`
- `user_roles`

Each table gets a row with: table name, description, record count, and a download button.

A **"Download All"** button at the top exports every table as individual CSVs bundled in sequence (one after another download, or as a ZIP if we add JSZip).

### 2. Shared CSV utility: `src/lib/csvExport.ts`
Reusable functions:
- `exportTableAsCSV(tableName, data, filename)` — converts array of objects to CSV and triggers browser download
- `fetchFullTable(tableName)` — fetches all rows from a Supabase table (handles pagination beyond 1000-row limit by using range queries)

### 3. RLS consideration
Most back-office tables already allow authenticated SELECT for all users, but user data tables are restricted to own data. For admin export, we need a **Supabase Edge Function** (`admin-export`) that uses the service role key to fetch any table's full data. The admin panel calls this function with the table name, and it returns the full dataset.

Alternatively, since many config tables are already readable by authenticated users, we can:
- Export config tables directly from the client
- Export user data tables via a new `admin_export_table` RPC (SECURITY DEFINER) that checks admin role before returning data

**Chosen approach:** New Edge Function `admin-data-export` that:
- Accepts `{ table: string }` in the request body
- Validates the table name against an allowlist
- Checks the caller is an admin (via JWT)
- Returns all rows as JSON

### 4. Wire into AdminPanel
- Add `DataExportTab` as a new tab with `Database` icon
- Place it near the end of the tab list (after existing management tabs)

### 5. Files

| File | Action |
|------|--------|
| `src/lib/csvExport.ts` | Create — shared CSV download utility |
| `src/components/admin/DataExportTab.tsx` | Create — export UI with table list and download buttons |
| `supabase/functions/admin-data-export/index.ts` | Create — Edge Function for full-table export with admin check |
| `src/pages/AdminPanel.tsx` | Edit — add DataExport tab |

## Technical Notes
- The Edge Function uses an allowlist of table names to prevent arbitrary SQL injection
- Pagination: fetches in batches of 1000 using `.range()` until all rows are retrieved
- CSV escaping handles commas, quotes, and newlines
- JSONB columns are serialized as JSON strings in CSV cells
- The exported CSVs are ready to feed directly into external LLMs for prompt generation

