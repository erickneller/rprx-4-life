

# User Guide System in Admin Panel

## What We're Building
A new "User Guide" tab in the Admin Panel that manages a complete, multi-section user manual. Each section corresponds to an app page/feature, is pre-populated with default content, and is editable by admins. Users (and admins) can download the entire guide as a PDF.

## Approach

This is a **client-side feature** -- no new database tables needed. The guide content will be stored in a new `user_guide_sections` table so admins can edit it persistently.

### 1. Create Database Table: `user_guide_sections`

New migration:
```sql
CREATE TABLE public.user_guide_sections (
  id text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_guide_sections ENABLE ROW LEVEL SECURITY;

-- Admins full CRUD
CREATE POLICY "Admins can manage guide sections" ON public.user_guide_sections
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read (for PDF download)
CREATE POLICY "Authenticated can read guide" ON public.user_guide_sections
  FOR SELECT TO authenticated USING (true);
```

Then seed with default content covering all app sections: Welcome/Overview, Dashboard, Profile/Wizard, Assessment, Results, Strategy Assistant, Plans, Debt Eliminator, Onboarding Journey, and Company Dashboard. Each section gets a markdown body describing the page's purpose, features, and how to use it.

### 2. Create `UserGuideTab` Admin Component

**File: `src/components/admin/UserGuideTab.tsx`**

- Fetches all sections from `user_guide_sections` ordered by `sort_order`
- Displays an accordion-style list of sections, each with:
  - Title (editable Input)
  - Body (editable Textarea with markdown)
  - Active toggle (Switch)
  - Save button per section
- "Add Section" button for custom sections
- Delete button per section
- **"Download PDF" button** at the top that generates a PDF of all active sections using jsPDF (already a project dependency from `planExport.ts`)

### 3. Create `useUserGuide` Hook

**File: `src/hooks/useUserGuide.ts`**

- `useQuery` to fetch all active sections ordered by `sort_order`
- Used by both the admin tab (all sections) and the PDF generator (active only)

### 4. Create PDF Export Utility

**File: `src/lib/userGuideExport.ts`**

- Uses jsPDF (already installed) to generate a multi-page PDF
- Title page: "RPRx User Guide" with date
- Table of contents
- Each section rendered as a heading + body text with page breaks
- Handles markdown-to-plain-text conversion for the PDF

### 5. Wire Into Admin Panel

**File: `src/pages/AdminPanel.tsx`**

- Add new tab trigger: `<TabsTrigger value="user-guide">User Guide</TabsTrigger>`
- Add `<TabsContent value="user-guide"><UserGuideTab /></TabsContent>`
- Import the new component

### Default Content Sections (seeded via migration INSERT)

| ID | Title |
|----|-------|
| welcome | Welcome to RPRx |
| dashboard | Your Dashboard |
| wizard | Profile Setup Wizard |
| assessment | Financial Assessment |
| results | Understanding Your Results |
| strategies | Strategy Assistant |
| plans | Your Plans |
| debt-eliminator | Debt Eliminator |
| onboarding | 30-Day Onboarding Journey |
| profile | Managing Your Profile |
| company | Company Dashboard |
| gamification | Points, Badges & Streaks |

Each body will contain 3-5 paragraphs of helpful default content in markdown format describing how to use that feature.

## Summary of Files

| Action | File |
|--------|------|
| Migration | `supabase/migrations/` -- new table + seed data |
| New | `src/hooks/useUserGuide.ts` |
| New | `src/components/admin/UserGuideTab.tsx` |
| New | `src/lib/userGuideExport.ts` |
| Modified | `src/pages/AdminPanel.tsx` -- add tab |

