## Goal
Save each user's health assessment results to their account, surface them on the existing **My Assessments** page alongside financial assessments (with a type badge), allow them to view, edit-in-place, or start a fresh new health assessment. Remove the "Email me my results" button (Save as PDF / Print stays).

## Database
New table `user_health_assessments` (per-user, RLS scoped to `auth.uid()`):

- `id` uuid pk
- `user_id` uuid (not null)
- `persona`, `primary_horseman`, `secondary_horseman`, `recommended_track` text
- `readiness_score` int, `readiness_label` text
- `horseman_scores` jsonb, `quick_wins` jsonb, `weekly_focus` jsonb
- `basic_profile` jsonb, `health_habits` jsonb, `screenings` jsonb, `goals` jsonb (full answer payload so we can repopulate the wizard for edits)
- `bmi` numeric (nullable)
- `created_at`, `updated_at` timestamps

Grants: `authenticated` SELECT/INSERT/UPDATE/DELETE; `service_role` ALL. RLS: users CRUD only `WHERE user_id = auth.uid()`. Trigger to maintain `updated_at`.

## Frontend

### Save on completion
- In `PhysicalSnapshotReport.tsx`, when the snapshot is generated and the user is authenticated, upsert into `user_health_assessments` (one active record per user — edit overwrites it).
- The existing GHL webhook call stays unchanged.

### Remove email option
- Strip the "Email My Results" button, `onEmail`/`emailing` props, and the `email_snapshot` handler/state from `PhysicalSnapshotReport.tsx` and its `CTASection`. Keep Print / Save as PDF.
- Leave the `email_snapshot` branch in the `send-to-ghl` edge function in place (harmless) but no longer invoked from the app.

### My Assessments page
- New hook `useHealthAssessment()` fetches the current user's saved health assessment.
- Extend `AssessmentHistory` (or add a sibling `HealthAssessmentHistory` block within `Assessments.tsx`) to render a card for the saved health assessment with a **Health** type badge to distinguish it from financial ones.
- Card actions: **View results**, **Edit answers**, **Take new assessment**, **Delete**.

### View / Edit / Retake flow
- `HealthAssessment.tsx` reads URL params:
  - `?view=1` → hydrate store from saved record and jump straight to `currentStep = 6` (results) — no editing.
  - `?edit=1` → hydrate store from saved record, start at step 1, mark `editMode` so completion **updates** the existing row in place.
  - default (no params) → fresh assessment (reset store), insert new row on completion (replaces prior — single active record).
- Add `loadFromSnapshot(record)` and `editingId` to the zustand store.

## Out of scope
No changes to GHL sync, scoring logic, or financial assessment flow. No anonymous/embed saving (only authenticated users get history).

## Technical notes
- Cast `supabase.from('user_health_assessments') as any` to avoid deep-type errors until types regen.
- Edit mode = `UPDATE` existing row (per your decision); a "Take new assessment" still overwrites since we keep a single active record per user. If you'd prefer multiple historical rows for retakes, say the word and I'll switch retake to INSERT.