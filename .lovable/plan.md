## Add `streak_visible` feature flag

Mirror the existing `xp_score_visible` flag for the day-streak indicator so admins can hide it globally.

### Database
- New migration seeding `('streak_visible', true, '')` into `feature_flags`.

### Admin
- `src/components/admin/FeaturesTab.tsx`: add toggle row using `useFeatureFlag('streak_visible')` + `useToggleFeatureFlag('streak_visible')`, same pattern as XP toggle.

### Hide streak UI when flag is off
Wrap streak renders with `useFeatureFlag('streak_visible')`:
- `src/components/dashboard/DashboardStreakBar.tsx` — hide flame chip (return null if neither streak nor XP visible).
- `src/components/layout/AppSidebar.tsx` — hide `<StreakCounter compact />` (the sidebar "2 days" in the screenshot).
- `src/components/dashboard/DashboardCardRenderer.tsx` — hide `<StreakCounter />` card.
- `src/pages/Profile.tsx` — hide `<StreakCounterComponent />`.

Out of scope: admin user table column, onboarding milestone streak display, daily check-in flame (these are contextual, not the global "score" UI).
