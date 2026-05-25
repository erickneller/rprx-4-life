Root cause found: the database row for RPRx Library is `id = 'library'`, but the route guard currently looks for `item:library`. Because it cannot find the DB row, it falls back to the old hardcoded rule where `library` requires `partner`, so the upgrade popup still appears even though the admin setting is Free.

Answer to your tier question: yes, the access model should be consistently aligned as Free, Partner, and Pro. The old `paid` value should remain only as a legacy alias for Partner so existing users do not break.

Plan:

1. Make route gating DB-driven by URL and aliases
   - Update `UpgradeRouteGuard` so it finds a sidebar row by:
     - known nav ID alias, and
     - matching route URL like `/library`
   - This will make `/library` respect the actual `sidebar_nav_config.required_tier = free` row.

2. Normalize user tiers everywhere
   - Add a helper that normalizes user access to `free | partner | pro`.
   - Treat legacy `paid` as `partner`.
   - Keep the hierarchy: `free < partner < pro`.

3. Fix sidebar feature mapping for existing DB IDs
   - Add support for both old and current nav IDs, including `library` and `item:library`.
   - Add the same robustness for partners/advisor IDs where relevant.

4. Fix direct sidebar-only gating gaps
   - The special “Speak With A Virtual Advisor” sidebar CTA is currently rendered separately from the admin nav config, so it can bypass DB-driven tier rules.
   - Update it to use the same required-tier logic as other left-side links.

5. Keep library video gating per-video
   - Library page access will be controlled by the Library sidebar item tier.
   - Individual videos will continue to use each video’s own `required_tier`.
   - Free videos stay open; Partner/Pro videos show the upgrade prompt only when the user is below that tier.

No database migration should be needed unless you want to remove the legacy `paid` tier later; for now, mapping `paid` to Partner is the safest compatibility path.