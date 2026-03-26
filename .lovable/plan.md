

# Admin Knowledge Base Sync Tab

## Overview
Add a new "Knowledge Base" tab to the Admin Panel where each row represents a document source (Google Doc, etc.) with a name, description, Google link, and a "Sync" button. When clicked, the sync button fetches the doc content via an edge function and stores it in a new `knowledge_base` Supabase table. The `rprx-chat` edge function can then inject this content as context.

## Changes

### 1. New Supabase table: `knowledge_base`
```sql
CREATE TABLE public.knowledge_base (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  last_synced_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Admin-only CRUD
CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. New edge function: `sync-knowledge-base`
- Accepts `{ id, source_url }` from the admin client
- Fetches the Google Doc as plain text using the published-to-web export URL (`/export?format=txt`)
- Upserts the `content` and `last_synced_at` into the `knowledge_base` table
- Returns success/failure

### 3. New admin component: `KnowledgeBaseTab.tsx`
- Lists all rows from `knowledge_base` with columns: Name, Description, Google Link (editable input), Last Synced, Active toggle
- "Add Document" button to create new entries
- "Sync" button per row that calls the edge function and shows a loading spinner
- "Sync All" button in the toolbar
- Edit/delete capabilities for each entry

### 4. New hook: `useKnowledgeBase.ts`
- CRUD queries and mutations for the `knowledge_base` table
- `useSyncKnowledgeBase` mutation that invokes the edge function

### 5. Wire into AdminPanel.tsx
- Import `KnowledgeBaseTab` and add a new tab trigger with a `BookOpen` icon labeled "Knowledge Base"