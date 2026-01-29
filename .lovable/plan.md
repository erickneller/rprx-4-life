
# Implementation Plans Feature

## Overview
Create a system that allows users to save, review, and download personalized implementation plans derived from their Strategy Assistant conversations.

---

## Data Model

### New Database Table: `saved_plans`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who saved the plan |
| title | text | User-editable title |
| strategy_id | text | Reference to strategy (e.g., "T-5", "I-3") |
| strategy_name | text | Snapshot of strategy name |
| content | jsonb | Full implementation steps and notes |
| status | enum | "not_started", "in_progress", "completed" |
| notes | text | User's personal notes |
| created_at | timestamp | When plan was saved |
| updated_at | timestamp | Last modification |

The `content` field stores structured data:
```json
{
  "steps": ["Step 1...", "Step 2..."],
  "summary": "Strategy summary",
  "horseman": ["Taxes"],
  "savings": "$10,000 - $50,000+",
  "complexity": 3,
  "requirements": "...",
  "taxReference": "IRC §199A",
  "disclaimer": "..."
}
```

---

## Feature Components

### 1. Save Plan Action (in Chat)

Add a "Save Plan" button that appears when the assistant recommends a strategy with implementation steps.

**Detection Logic**: Parse assistant messages for strategy IDs (T-1, I-3, etc.) or implementation plan patterns.

**UI**: Floating action button or inline button within message bubbles for strategies.

### 2. Saved Plans Page (`/plans`)

A new page accessible from dashboard showing all saved plans.

**Features**:
- List view of all saved plans with status indicators
- Filter by status (Not Started / In Progress / Completed)
- Filter by Horseman type (Interest, Taxes, Insurance, Education)
- Search by title/strategy name
- Sort by date created or last updated

### 3. Plan Detail View (`/plans/:id`)

Individual plan page with full details.

**Features**:
- Strategy name, summary, and metadata
- Step-by-step implementation checklist (interactive)
- Personal notes section
- Status toggle
- Edit title
- Delete plan option
- Download as PDF/Markdown

### 4. Download Options

**PDF Export**: Formatted document including:
- Plan title and creation date
- Strategy overview (name, horseman, complexity, savings potential)
- Step-by-step implementation checklist
- Tax references and disclaimers
- User notes

**Markdown Export**: Plain text version for personal note systems.

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Plans.tsx` | Plans list page |
| `src/pages/PlanDetail.tsx` | Individual plan view |
| `src/components/plans/PlanCard.tsx` | Card for plans list |
| `src/components/plans/PlanChecklist.tsx` | Interactive step checklist |
| `src/components/plans/PlanDownload.tsx` | Download functionality |
| `src/components/plans/SavePlanButton.tsx` | Button for chat messages |
| `src/hooks/usePlans.ts` | React Query hooks for plans |
| `src/lib/planExport.ts` | PDF/Markdown generation utilities |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes for /plans and /plans/:id |
| `src/components/assistant/MessageBubble.tsx` | Add save button for strategy messages |
| `src/components/dashboard/DashboardHome.tsx` | Add "My Plans" navigation button |
| `src/integrations/supabase/types.ts` | Auto-updated with new table types |
| `supabase/functions/rprx-chat/index.ts` | Add strategy ID tagging to responses |

### Database Migration

```sql
-- Create plan status enum
CREATE TYPE plan_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create saved_plans table
CREATE TABLE saved_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  strategy_id text,
  strategy_name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  status plan_status NOT NULL DEFAULT 'not_started',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own plans
CREATE POLICY "Users can view their own plans"
  ON saved_plans FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own plans"
  ON saved_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own plans"
  ON saved_plans FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own plans"
  ON saved_plans FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_plans_updated_at
  BEFORE UPDATE ON saved_plans
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

## User Flow

```text
User Flow for Saving and Using Plans:

1. User chats with Strategy Assistant
          |
          v
2. Assistant recommends strategy with implementation steps
          |
          v
3. User clicks "Save Plan" button on message
          |
          v
4. Modal opens to customize title and add notes
          |
          v
5. Plan saved to database
          |
          v
6. User accesses Plans page from Dashboard
          |
          v
7. Views plan details, tracks progress with checklist
          |
          v
8. Downloads PDF/Markdown for offline reference
```

---

## PDF Generation Approach

Use client-side PDF generation with a library like `jspdf` or `@react-pdf/renderer`:

- `jspdf`: Lightweight, simple text and table layout
- `@react-pdf/renderer`: React-native syntax, better styling control

Recommended: `jspdf` for simplicity given the structured nature of the content.

---

## Phase 1 (MVP)

1. Database table and migrations
2. Basic save functionality from chat
3. Plans list page with cards
4. Plan detail page with checklist
5. Markdown download

## Phase 2 (Enhancement)

1. PDF download with styled formatting
2. Progress tracking with step completion persistence
3. Filter and search on plans list
4. Dashboard widget showing active plans
5. Email reminders for in-progress plans

---

## Security Considerations

- All plans protected by RLS (users see only their own)
- Strategy content is copied at save time (snapshot, not reference)
- No sensitive financial data stored in plans
- Download happens client-side (no server-side file generation)
