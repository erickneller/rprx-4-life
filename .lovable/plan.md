

# 30-Day Gamified Onboarding Journey

## Overview
A retention engine that delivers daily micro-content alongside the user's active plan. 30 days of lessons, quizzes, reflections, and milestones personalized by primary horseman. Points feed into `profiles.total_points_earned` (not RPRx Score). Auto-starts after first assessment completion.

## Database Changes

### New Table: `onboarding_content`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| day_number | integer, not null | 1-30 |
| phase | text, not null | clarity, awareness, second_win, identity, vision |
| horseman_type | text, not null | interest, taxes, insurance, education, universal |
| content_type | text, not null | micro_lesson, action_prompt, quiz, reflection, milestone |
| title | text, not null | |
| body | text, not null | Markdown content |
| action_text | text, nullable | CTA button label |
| action_type | text, nullable | navigate, complete_step, answer_quiz, reflect, share |
| action_target | text, nullable | Route path or action ID |
| quiz_data | jsonb, nullable | Structured quiz questions for quiz-type content |
| points_reward | integer, default 5 | |
| estimated_minutes | integer, default 3 | |
| sort_order | integer, default 0 | |
| is_active | boolean, default true | |
| created_at | timestamptz, default now() | |

RLS: Authenticated users can SELECT. Admins can INSERT/UPDATE/DELETE.

### New Table: `user_onboarding_progress`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid, not null | References auth.users |
| onboarding_start_date | date, not null | |
| current_day | integer, default 1 | |
| completed_days | jsonb, default '[]' | Array of day numbers |
| current_phase | text, default 'clarity' | |
| streak_count | integer, default 0 | |
| total_points_earned | integer, default 0 | |
| quiz_answers | jsonb, default '{}' | Keyed by day number |
| reflections | jsonb, default '{}' | Keyed by day number |
| status | text, default 'active' | active, paused, completed, expired |
| completed_at | timestamptz, nullable | |
| created_at | timestamptz, default now() | |
| updated_at | timestamptz, default now() | |

UNIQUE on (user_id). RLS: users own-row access for SELECT/INSERT/UPDATE.

### Profile Column Addition
- `onboarding_completed` (boolean, default false) on `profiles` table

### Seed Data: `onboarding_content`
Seed all 30 days of universal content plus horseman-specific variants for Days 2, 5, 6, and 15 (as specified in the prompt). Days 16-18 and 22-25 get universal placeholders. Day 7 quiz uses `quiz_data` JSONB column for structured Q&A; the `body` field contains only the intro text.

### Badge Seed Data
Insert 4 new badge_definitions:
- `onboarding_week1` (25 pts, day 7 milestone)
- `onboarding_week2` (40 pts, day 14 milestone)
- `onboarding_month` (100 pts, day 30 milestone)
- `quiz_ace` (25 pts, perfect quiz answers)

## New Files

### `src/lib/onboardingEngine.ts`
Core logic functions:

- **`getOnboardingContent(dayNumber, primaryHorseman)`**: Queries `onboarding_content` for the given day. Returns horseman-specific version if available, else universal fallback.

- **`completeDay(userId, dayNumber, response?)`**: Adds day to `completed_days` array, awards `points_reward` to `profiles.total_points_earned`, updates `current_day`, `current_phase` (mapped from day ranges), and `streak_count`. If quiz type and response provided, saves to `quiz_answers`. If reflection type, saves to `reflections`. On day 30: sets status='completed', `completed_at`, and `profiles.onboarding_completed=true`. Checks for onboarding milestone badges.

- **`getAvailableDay(userId)`**: Returns the lowest uncompleted day <= days since `onboarding_start_date`. No skipping ahead.

- **`startOnboarding(userId)`**: Creates `user_onboarding_progress` record. Skips silently if record already exists (upsert with ON CONFLICT DO NOTHING).

### `src/hooks/useOnboarding.ts`
React Query hook that:
- Fetches `user_onboarding_progress` for current user
- If no record exists AND user has a completed assessment, calls `startOnboarding`
- Fetches today's content via `getOnboardingContent` using primary horseman from latest assessment
- Returns: `isOnboarding`, `currentDay`, `todayContent`, `completedDays`, `currentPhase`, `streak`, `totalPoints`, `progress` (0-100), `completeToday(response?)`, `isCompleted`
- Invalidates queries on completion

### `src/components/onboarding/OnboardingCard.tsx`
Dashboard card (warm amber/orange gradient) showing:
- "Day X of 30 -- [Phase Name]" header with circular day counter
- 5 phase progress dots (Clarity, Awareness, Second Win, Identity, Vision)
- Today's content title and body (rendered as markdown via react-markdown, already a dependency)
- Action button with `action_text`, time estimate badge, points badge
- If today completed: checkmark overlay with "Come back tomorrow" message
- Streak indicator when streak > 1
- Renders nothing if onboarding completed or not started (self-hiding)
- Supports `compact` prop

### `src/components/onboarding/OnboardingProgressBar.tsx`
Horizontal 30-segment bar with 5 phase sections labeled. Filled segments for completed days, current day pulsing. Sits above dashboard cards during active onboarding.

### `src/components/onboarding/OnboardingQuiz.tsx`
Renders questions from `quiz_data` JSONB. RadioGroup for multiple choice. Shows correct/incorrect feedback after answering. Full points for correct, partial for incorrect.

### `src/components/onboarding/OnboardingReflection.tsx`
Textarea for reflection responses. Shows previous reflections if revisiting. Save button stores to `user_onboarding_progress.reflections`.

### `src/components/onboarding/OnboardingMilestone.tsx`
Celebration card for milestone days (3, 7, 14, 21, 30). CSS keyframe sparkle animation. Cumulative stats display. Day 30 gets extra-large treatment.

### `src/components/admin/OnboardingTab.tsx`
Admin tab with sortable table of `onboarding_content`:
- Columns: Day, Phase, Horseman, Type, Title, Points, Active toggle
- Inline editing for title, body, action_text, points_reward, is_active
- Add new row button
- Follows existing admin tab patterns (same table/dialog approach as BadgesTab)

## Modified Files

### `src/hooks/useAssessment.ts`
After assessment saves successfully (line ~285, before `navigate`), call `startOnboarding(user.id)`. Import from onboardingEngine. Fire-and-forget (don't block navigation).

### `src/components/dashboard/DashboardCardRenderer.tsx`
Add to component registry:
```
'OnboardingCard': <OnboardingCard />
```

### `src/components/dashboard/DashboardContent.tsx`
Import `useOnboarding` hook. When `isOnboarding` is true, render `OnboardingProgressBar` above the `DashboardCardRenderer`.

### `src/pages/AdminPanel.tsx`
Add "Onboarding" tab trigger (with GraduationCap icon) and `TabsContent` rendering `<OnboardingTab />`.

### `src/lib/gamification.ts`
Add `'onboarding_day_complete'` to the `ActivityType` union so badge checks can fire for onboarding milestones.

### `dashboard_card_config` seed (data INSERT)
Insert row: `('onboarding', 'Daily Journey', 'OnboardingCard', 2, true, 'full', '30-day onboarding journey with daily micro-lessons and actions')`.

## Implementation Sequence

1. **Migration**: Create tables (`onboarding_content`, `user_onboarding_progress`), add `profiles.onboarding_completed` column
2. **Seed data**: Insert all 30 days of content + badge definitions + dashboard_card_config row
3. **Core engine**: `onboardingEngine.ts`
4. **Hook**: `useOnboarding.ts`
5. **UI components**: OnboardingCard, ProgressBar, Quiz, Reflection, Milestone
6. **Integration**: DashboardCardRenderer registry, DashboardContent progress bar, useAssessment auto-start
7. **Admin tab**: OnboardingTab + AdminPanel integration

## Technical Notes

- Onboarding points add to `profiles.total_points_earned` only -- RPRx Score (0-100) is unaffected
- `quiz_data` JSONB structure: `{ questions: [{ question: string, options: [{ label: string, value: string }], correct: string }] }`
- Day availability: user can only access days <= `daysSince(onboarding_start_date)` and must complete in order (lowest uncompleted day first)
- If user misses days, they catch up sequentially -- journey is always 30 content days
- Streak resets if a calendar day is skipped without completing the available day
- All copy follows discovery language rules (never "wasting", "losing", etc.)
- OnboardingCard self-hides when `isCompleted` or not started, so `is_visible` in dashboard_card_config can stay true

