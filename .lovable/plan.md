

# Admin Day Navigation for Onboarding Card

## Overview
Add forward/backward arrow buttons to the OnboardingCard that only appear for admins, allowing them to browse all 30 days of content without calendar-day restrictions.

## Approach

### 1. `OnboardingCard.tsx`
- Import `useAdmin` hook
- Add local state `adminDayOverride: number | null` (default `null`)
- When `isAdmin && adminDayOverride !== null`, fetch content for that day instead of `currentDay`
- Render `ChevronLeft` / `ChevronRight` buttons flanking the day number badge (only when `isAdmin`)
  - Left disabled at day 1, right disabled at day 30
  - Clicking updates `adminDayOverride`
- Add a small "Admin Preview" badge so it's clear this is a browse mode
- When in admin override mode, hide the completion button (or make it view-only) to prevent accidentally completing days out of order

### 2. `useOnboarding.ts`
- Export `getOnboardingContent` call parameters so the card can fetch arbitrary day content
- Alternative (simpler): add an optional `previewDay` parameter to the hook that overrides `availableDay` for content fetching only (without affecting completion logic)

### Files Changed
| File | Change |
|------|--------|
| `src/hooks/useOnboarding.ts` | Add optional `previewDay` param that overrides content fetch day |
| `src/components/onboarding/OnboardingCard.tsx` | Add admin nav arrows + preview state |

This is a small change — two files, no database work.

