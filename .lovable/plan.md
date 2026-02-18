
# Strategy Engine Overhaul: Query to Delivery

## Current State Assessment

### What exists today:
1. **Hardcoded strategy database**: 70 strategies embedded directly in the edge function (`rprx-chat/index.ts` -- 1,460 lines of strategy data)
2. **Database strategy table**: `strategy_definitions` with 518 rows managed via admin panel -- but **completely unused** by the edge function
3. **Prompt generator** (`promptGenerator.ts`): Builds auto-mode prompts from profile + assessment data, but missing several profile fields (filing status, retirement data, insurance coverage)
4. **Keyword matching** (`findRelevantStrategies`): Simple keyword scoring returns top 10 strategies -- no awareness of user profile, difficulty, or financial goals
5. **Two entry paths**: Auto-mode (from results page) and manual (Strategy Assistant chat)
6. **Profile context in edge function**: Fetches some profile fields but misses filing_status, retirement fields, and insurance coverage toggles

### Critical gaps identified:
- The edge function's hardcoded `STRATEGIES[]` array is completely disconnected from the admin-managed `strategy_definitions` table -- admins can add/edit/import strategies all day but the AI never sees them
- No pagination model for manual users (top 10, then next 10, etc.)
- No admin-editable prompt template -- prompt format is hardcoded in the edge function
- Missing profile data in AI context: filing status, retirement fields (years to retirement, desired income, balances, contributions), insurance coverage (health, life, disability, LTC)
- Auto-mode asks for "1 best strategy" but the system prompt still says "present strategies in a numbered list" -- conflicting instructions
- No tier-gating logic for manual vs. free users

---

## Implementation Plan

### Phase 1: Database-Driven Strategy Engine (Edge Function)

**Goal**: Replace the 1,460-line hardcoded `STRATEGIES[]` array with a live query to `strategy_definitions`.

**Changes to `supabase/functions/rprx-chat/index.ts`**:
- Remove the entire hardcoded `STRATEGIES[]` array (lines 40-1460)
- Add a function `fetchStrategies()` that queries `strategy_definitions` using a service-role Supabase client (since the edge function runs server-side)
- Map DB columns to the format the AI needs: `id`, `name`, `description`, `horseman_type`, `difficulty`, `estimated_impact`, `tax_return_line_or_area`, `financial_goals`, `steps`
- Update `findRelevantStrategies()` to work with the DB-fetched strategies, adding scoring for:
  - User's `financial_goals` matching strategy's `financial_goals`
  - User's `profile_type` matching strategy's `bestFor` / horseman alignment
  - Difficulty preference (prioritize "easy" for auto-mode, show all for manual)
- Filter out `is_active = false` strategies
- Cache strategies per request (single fetch at start of handler)

**Why**: This is the single most impactful change -- it connects the admin panel to the AI, making the system truly dynamic.

### Phase 2: Full Profile Context

**Goal**: Send ALL profile data to the AI so it can make better recommendations.

**Changes to `supabase/functions/rprx-chat/index.ts`**:
- Expand the profile query to include: `filing_status`, `years_until_retirement`, `desired_retirement_income`, `retirement_balance_total`, `retirement_contribution_monthly`, `health_insurance`, `life_insurance`, `disability_insurance`, `long_term_care_insurance`
- Add these to the `profileContext` string with appropriate labels
- Move "missing fields" logic to account for new fields

**Changes to `src/lib/promptGenerator.ts`**:
- Add filing status, retirement data, and insurance coverage to the auto-mode prompt
- Make the prompt dynamically include/exclude sections based on what data exists

### Phase 3: Dual-Mode Strategy Delivery

**Goal**: Free users get 1 best strategy (auto); paid users get paginated top-10 lists (manual).

#### Auto Mode (Free Users)
**Changes to edge function**:
- Detect auto-mode prompts (already partially works via `## My Assessment Results` marker)
- When auto-mode detected: rank all active strategies by fit score, pick the single best one based on: relevance to primary horseman, ease of implementation (difficulty = "easy" first), financial goals match
- Use a focused instruction: "Recommend exactly 1 strategy. Explain why it's the best fit. Provide full implementation steps."

#### Manual Mode (Paid Users)
**Changes to edge function**:
- Add a `mode` parameter to the request schema: `"auto"` | `"manual"` (default: inferred from message content as today)
- For manual mode, support a `page` parameter (default 1) and `strategies_per_page` (default 10)
- Return ranked strategies in batches of 10 with a "Show more strategies" prompt
- Allow users to select multiple strategies for plan generation

**Changes to `src/hooks/useSendMessage.ts`**:
- Add optional `mode` and `page` parameters to `SendMessageParams`

**Changes to `src/components/assistant/ChatThread.tsx`**:
- For manual mode, after listing 10 strategies, show a "Show Next 10" button
- Allow multi-select of strategies for plan generation
- Show "Generate Plan for Selected" button when strategies are selected

### Phase 4: Admin Prompt Editor

**Goal**: Let admins customize the system prompt template without deploying code.

**Database changes** (new table):
```sql
CREATE TABLE public.prompt_templates (
  id text PRIMARY KEY DEFAULT 'system_prompt',
  name text NOT NULL,
  content text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Seed with current prompt
INSERT INTO prompt_templates (id, name, content, description)
VALUES ('system_prompt', 'Main System Prompt', '<current BASE_SYSTEM_PROMPT content>', 'The main instruction set for the RPRx Strategy Assistant AI');

INSERT INTO prompt_templates (id, name, content, description)
VALUES ('auto_mode_instructions', 'Auto Mode Instructions', 'Based on all of the above, recommend exactly 1 strategy...', 'Instructions appended when auto-generating a strategy from assessment results');

INSERT INTO prompt_templates (id, name, content, description)
VALUES ('manual_mode_instructions', 'Manual Mode Instructions', 'Present the top 10 strategies...', 'Instructions for manual strategy browsing');
```

RLS: Admin-only write, authenticated read.

**Changes to edge function**:
- Fetch prompt template from `prompt_templates` table instead of using hardcoded `BASE_SYSTEM_PROMPT`
- Fall back to hardcoded prompt if DB fetch fails

**Changes to Admin Panel**:
- New "Prompt Templates" tab with a textarea editor for each template
- Preview button to see the rendered prompt with sample data
- Save button with confirmation

### Phase 5: Smart Strategy Ranking Algorithm

**Goal**: Replace simple keyword matching with a scoring algorithm that considers the full user context.

The new `scoreStrategy()` function will weight:
| Factor | Weight | Description |
|--------|--------|-------------|
| Horseman match | 30% | Strategy horseman matches user's primary horseman |
| Financial goals match | 25% | Strategy goals overlap with user's goals |
| Difficulty fit | 15% | Easy strategies scored higher for auto-mode |
| Profile type relevance | 15% | Strategy suitability for user's profile type |
| Cash flow compatibility | 10% | High-savings strategies deprioritized for deficit users |
| Previously completed | -100% | Already-completed strategies excluded entirely |

---

## Files to Modify

1. **`supabase/functions/rprx-chat/index.ts`** -- Major rewrite: remove hardcoded strategies, fetch from DB, expand profile context, add mode/page support, fetch prompt template from DB
2. **`src/lib/promptGenerator.ts`** -- Add all profile fields, mode-specific instructions
3. **`src/hooks/useSendMessage.ts`** -- Add mode/page params
4. **`src/components/assistant/ChatThread.tsx`** -- Manual mode pagination UI, multi-select strategies
5. **`src/pages/AdminPanel.tsx`** -- Add Prompt Templates tab

## New Files

1. **None for components** -- all changes extend existing files

## Database Changes

1. New `prompt_templates` table with RLS (admin write, authenticated read)

---

## Sequencing

1. Phase 1 (DB-driven strategies) -- highest impact, do first
2. Phase 2 (full profile context) -- quick win, do alongside Phase 1
3. Phase 5 (ranking algorithm) -- builds on Phase 1
4. Phase 3 (dual-mode delivery) -- depends on Phases 1+2
5. Phase 4 (admin prompt editor) -- independent, can be done anytime

## Things You Should Know

- The edge function is currently ~2,078 lines; removing the hardcoded strategies will cut it to ~600 lines
- The 518 strategies in `strategy_definitions` may have different field structures than the hardcoded ones (e.g., `steps` as JSON array vs. `implementationPlan`); the mapping layer handles this
- Free tier enforcement (`isFree = true`) is currently hardcoded; this plan doesn't change that but prepares the manual mode for when paid tiers are implemented
- The `4000 character` message limit on the edge function may need to increase for the auto-mode prompt which can be long with full profile + assessment data
