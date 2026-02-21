# Add "XP Score" Label + Definition

## Changes

### 1. Sidebar compact label (`GamificationScoreCard.tsx`, line 85)

Change `"XP"` to `"XP Score"` so both metrics read consistently:

- **RPRx Score** | **XP Score**

### 2. Dashboard "Recent Achievements" card (`RecentBadges.tsx`)

Add a short explanatory line below the XP total to define what XP Score means. Something like:

> XP = Experience Points. Earn XP by completing assessments, unlocking badges, and maintaining streaks.

This sits as a small muted-text line under the `"⭐ 1,250 XP"` header, before the badge list. Keeps the card clean while giving first-time users immediate clarity.

## Technical Details

`**src/components/gamification/GamificationScoreCard.tsx**` (line 85):

- Change label from `"XP"` to `"XP Score"`

`**src/components/gamification/RecentBadges.tsx**` (after line 27):

- Add a `<p>` with muted styling: `"XP = Experience Points. Earn XP by completing assessments, unlocking badges, and maintaining streaks."`

No other files, logic, or database changes needed.