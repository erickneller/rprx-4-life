

# Admin-Managed XP Activity System

## Current State

The XP system is active but has two separate XP sources:

1. **Badge XP** -- Already admin-managed via the `badge_definitions` table. When a badge is earned, its `points` value is awarded. This works well.

2. **Activity XP** -- Hardcoded values scattered across component files:
   - Strategy activated: 50 XP (in StrategyActivationCard.tsx)
   - Strategy completed: 30 XP (in MyStrategiesCard.tsx)
   - Deep Dive completed: 75 XP (in DeepDiveWizard.tsx)
   - Profile updated: no XP awarded directly
   - Assessment completed: no XP awarded directly
   - Login/streak: no direct XP (only badge XP)

There is also a gap: the `logActivity` function inserts `points_earned: 0` into `user_activity_log` -- meaning the activity log doesn't reflect the actual XP shown in toasts. The XP toasts are cosmetic only in some cases and don't always update `profiles.total_points_earned`.

## What We'll Build

A new `activity_xp_config` table that defines base XP for each activity type, fully manageable from the Admin Panel.

### Database: New table `activity_xp_config`

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Matches activity type key (e.g., `strategy_completed`) |
| display_name | text | Human-readable label (e.g., "Strategy Completed") |
| description | text | What triggers this activity |
| base_xp | integer | XP awarded each time |
| is_active | boolean | Enable/disable XP for this activity |
| sort_order | integer | Admin display ordering |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: Authenticated users can SELECT. Admins can INSERT/UPDATE/DELETE.

### Seed data

| ID | Display Name | Base XP |
|----|-------------|---------|
| login | Daily Login | 5 |
| assessment_complete | Assessment Completed | 25 |
| deep_dive_complete | Deep Dive Completed | 75 |
| strategy_activated | Strategy Activated | 50 |
| strategy_completed | Strategy Completed | 30 |
| profile_updated | Profile Updated | 10 |
| onboarding_day_complete | Onboarding Day Completed | 10 |
| plan_step_completed | Plan Step Completed | 15 |

### Code Changes

**1. New hook: `src/hooks/useActivityXpConfig.ts`**
- Fetches all active `activity_xp_config` rows
- Returns a lookup map: `Record<string, number>` (activity_id -> base_xp)
- React Query with 30-minute stale time (rarely changes)
- Exports a helper: `getXpForActivity(configMap, activityType): number`

**2. Update `src/lib/gamification.ts`**
- Accept an optional `xpConfig` map in `logActivity`-related functions
- When logging to `user_activity_log`, use the config-driven XP value instead of hardcoded 0
- After logging, increment `profiles.total_points_earned` by the base XP amount

**3. Update `src/hooks/useGamification.ts`**
- Fetch the XP config via the new hook
- Pass config values into `logActivity` so it writes the correct `points_earned`
- After each activity, update `profiles.total_points_earned` with the config-driven XP

**4. Update calling components** (remove hardcoded XP values)
- `MyStrategiesCard.tsx`: Replace `showPointsEarnedToast(30, ...)` with the config-driven value
- `StrategyActivationCard.tsx`: Replace `showPointsEarnedToast(50, ...)` with config-driven value
- `DeepDiveWizard.tsx`: Replace `showPointsEarnedToast(75, ...)` with config-driven value
- `Profile.tsx`: Add XP toast using config value for `profile_updated`

**5. New Admin tab: `src/components/admin/ActivityXpTab.tsx`**
- Table view showing all activity XP configs: Display Name, Description, Base XP, Active toggle
- Inline edit or modal for changing XP values
- "Add Activity" button for future activity types
- No delete for seed activities (to prevent breaking references), but admin can set `is_active = false`

**6. Update `src/pages/AdminPanel.tsx`**
- Add new "XP Activities" tab with a Zap icon next to the existing Badges tab

### How It All Connects

```text
User performs action (e.g., completes strategy)
  --> Component calls logActivity('strategy_completed', context)
    --> useGamification looks up 'strategy_completed' in activity_xp_config
    --> Inserts into user_activity_log with points_earned = 30 (from config)
    --> Updates profiles.total_points_earned += 30
    --> Checks badge eligibility (badge_definitions, already admin-managed)
    --> Shows XP toast with config-driven value
    --> Shows badge toast if any earned
```

This means admins can change the XP value for any activity at any time, and the entire app reflects it immediately (within the React Query stale window).

## What This Does NOT Change
- Badge XP remains managed separately via the existing Badges admin tab
- The RPRx Score (financial wellness 0-100) is unaffected -- it's a separate calculation
- Onboarding day XP continues to use `onboarding_content.points_reward` for per-day granularity, but can be supplemented by the base `onboarding_day_complete` config
