## Make Daily Check-In optional on the dashboard

Currently the "Did you make progress on your strategy today?" card (`DailyCheckIn`) is hardcoded into `DashboardContent.tsx` and always renders when a user has an active strategy. Admins can't turn it off, and users can't reorder it like the other cards.

### Changes

1. **Register `DailyCheckIn` as a configurable dashboard card**
   - Add a migration inserting a row into `dashboard_card_config` with `component_key = 'DailyCheckIn'`, default visible, sort_order near the top.
   - Add a `case 'DailyCheckIn'` branch in `DashboardCardRenderer.tsx` that renders `<DailyCheckIn />`.

2. **Remove the hardcoded render**
   - In `src/components/dashboard/DashboardContent.tsx`, remove the standalone `<DailyCheckIn />` (line 145) so it only appears via the config-driven renderer.

3. **Result**
   - Admins toggle visibility from Admin Panel → Dashboard tab (existing UI, no changes needed).
   - Users can reorder/hide it alongside other cards.
   - If hidden, it disappears for everyone immediately.
   - Self-hiding logic inside `DailyCheckIn` (no active strategy / already checked in / dismissed) still applies.
