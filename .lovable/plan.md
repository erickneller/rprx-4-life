
# Expand Admin Panel: Full Content Management + Analytics

## Overview
Add 4 new tabs to the existing Admin Panel: **Badge Definitions**, **Assessment Questions**, **Deep Dive Questions**, and an **Analytics Dashboard**. This gives admins complete control over all seeded content tables plus visibility into platform usage.

---

## What Gets Built

### Tab 1: Badge Definitions Management
Full CRUD for the 21 existing badges:
- **Table columns**: ID, Name, Icon, Category, Trigger Type, Points, Active toggle
- **Create/Edit form fields**: id, name, description, icon (emoji/text), category, trigger_type, trigger_value (JSON), points, sort_order, is_active
- Delete with confirmation dialog

### Tab 2: Assessment Questions Management
Full CRUD for the 15 core assessment questions:
- **Table columns**: Order, Question Text (truncated), Category, Type, Horseman Weights preview
- **Create/Edit form fields**: question_text, question_type (single_choice, multi_select, range, slider, yes_no), category, order_index, options (JSON editor), horseman_weights (JSON editor)
- Reordering via order_index field

### Tab 3: Deep Dive Questions Management
Full CRUD for the 20 deep-dive questions:
- **Table columns**: Horseman Type, Order, Question Text, Type
- **Create/Edit form fields**: horseman_type (select from 4 Horsemen), question_text, question_type, order_index, options (JSON editor)
- Filterable by Horseman type

### Tab 4: Analytics Dashboard
Read-only stats overview:
- Total users, total assessments completed, total active strategies
- Assessments per Horseman (primary_horseman breakdown)
- Recent signups (last 7 days)
- Badge earning stats (most/least earned)

---

## Technical Details

### Database Changes (Migration)
Add admin RLS policies to 3 tables that currently block all writes:

```sql
-- badge_definitions: admin CRUD
CREATE POLICY "Admins can insert badges" ON badge_definitions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update badges" ON badge_definitions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete badges" ON badge_definitions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- assessment_questions: admin CRUD
CREATE POLICY "Admins can insert questions" ON assessment_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update questions" ON assessment_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete questions" ON assessment_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- deep_dive_questions: admin CRUD
CREATE POLICY "Admins can insert deep dive questions" ON deep_dive_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update deep dive questions" ON deep_dive_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete deep dive questions" ON deep_dive_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### New Files
- `src/hooks/useAdminBadges.ts` -- query/mutation hooks for badge_definitions
- `src/hooks/useAdminQuestions.ts` -- query/mutation hooks for assessment_questions and deep_dive_questions
- `src/hooks/useAdminAnalytics.ts` -- read-only queries for analytics stats
- `src/components/admin/BadgesTab.tsx` -- Badge management tab UI
- `src/components/admin/AssessmentQuestionsTab.tsx` -- Assessment questions tab UI
- `src/components/admin/DeepDiveQuestionsTab.tsx` -- Deep dive questions tab UI
- `src/components/admin/AnalyticsTab.tsx` -- Analytics dashboard tab UI

### Modified Files
- `src/pages/AdminPanel.tsx` -- Add 4 new TabsTrigger + TabsContent entries, import the new tab components. This also cleans up the file by extracting the existing Strategies and Users tabs into their own components if needed.

### Pattern
Each tab follows the same proven pattern already used in the Strategies tab:
1. Table with key columns + active toggle
2. Create/Edit dialog with form fields
3. Delete confirmation AlertDialog
4. Toast notifications for success/error

### JSON Fields
For `options`, `horseman_weights`, and `trigger_value` fields, a simple Textarea with JSON validation will be used (parse on save, show error toast if invalid JSON).
