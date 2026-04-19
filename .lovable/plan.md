
The user wants to upload updated CSVs back into the admin panel. Currently the Data Export tab is download-only. Need to add import functionality.

Scope: import CSV → upsert rows into the matching table. Most useful for config tables (prompt_templates, strategy_definitions, assessment_questions, etc.) since that's the prompt-refinement workflow they've been describing. User-data tables are risky to bulk-overwrite.

Approach: add import UI alongside each config table, plus a secure edge function that validates admin + table allowlist + upserts by primary key.
