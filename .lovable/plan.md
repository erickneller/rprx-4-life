

# XP Score Display — Sidebar + Dashboard

## Overview
Add visible total XP alongside the RPRx Score in two places: the sidebar compact widget and the dashboard achievements card.

## Changes

### 1. Sidebar compact widget (`GamificationScoreCard.tsx` — compact mode)

Current layout:
```text
[RPRx Ring 80px]  🌱 Progressing
```

New layout:
```text
  RPRx Score        XP
  [Ring w/ 42]     1,250
```

- Remove the grade label text ("Progressing") from the compact view
- Add total XP from `profile.total_points_earned` next to the ring
- Add small labels ("RPRx Score" / "XP") above each value
- The ring stays as-is (shows RPRx score number + grade emoji inside)

The component will import `useProfile` to access `total_points_earned`.

### 2. Streak counter in sidebar (`StreakCounter.tsx` — compact mode)

Current: `🔥 7`

Updated: `🔥 7 days` — append "days" label for clarity. Keeps existing layout below the two scores.

### 3. Dashboard "Recent Achievements" card (`RecentBadges.tsx`)

- Add a header row showing total XP (e.g., "⭐ 1,250 XP") pulled from `useProfile().profile.total_points_earned`
- Keep "Recent Achievements" as the card title
- The XP total appears as a prominent number between the title and the badge list

## Technical Details

**Files modified:**
- `src/components/gamification/GamificationScoreCard.tsx` — compact mode: remove grade label, add XP display with `useProfile`
- `src/components/gamification/StreakCounter.tsx` — compact mode: append "days" text
- `src/components/gamification/RecentBadges.tsx` — add total XP header using `useProfile`

**No changes to:**
- Database schema or column names
- RPRx Score calculation logic
- Any scoring engines or hooks
- Full-size GamificationScoreCard (dashboard version)
