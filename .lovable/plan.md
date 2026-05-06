# Virtual Advisor Page + Admin Embed

## Changes

### 1. Rename CTA
- `src/components/dashboard/AdvisorCTACard.tsx`: change title to "Speak With A Virtual Advisor", button to "Open Advisor", link to internal route `/virtual-advisor` (always, regardless of `url` value). Keep visibility tied to existing `advisor_link` feature flag toggle so admins can still hide it.
- Same rename anywhere else the string "Speak with an RPRx Advisor" appears (sidebar/AppSidebar if present).

### 2. New page `/virtual-advisor`
- New file `src/pages/VirtualAdvisor.tsx` wrapped in `AuthenticatedLayout` with title "Virtual Advisor".
- Centered card in the middle of the page that injects the admin-provided embed code (script/HTML) into a container `div` via a `useEffect` that:
  - Parses the snippet, extracts `<script>` tags, creates real `HTMLScriptElement`s with matching `src` + `data-*` attributes (so the loader executes — `dangerouslySetInnerHTML` alone won't run scripts), and appends non-script HTML as innerHTML.
  - Cleans up appended nodes on unmount.
- Loading + empty state: if no embed configured, show "Advisor widget not configured yet. Check back soon." (admins see a hint linking to /admin → Features).
- Register route in `src/App.tsx` under `ProtectedRoute` + `WizardGuard`.

### 3. Admin embed management
- Reuse the existing `feature_flags` table by adding a new row `id = 'advisor_embed'` (uses existing `value` text column — no migration needed).
- New hook `src/hooks/useAdvisorEmbed.ts` mirroring `useAdvisorLink` (read `value`, update `value`).
- In `src/components/admin/FeaturesTab.tsx`, add a new Card "Virtual Advisor Embed" with a `<Textarea>` (monospace, ~10 rows) + Save button. Placeholder shows the LeadConnector script example. Note: scripts run in users' browsers — only paste trusted snippets.

## Out of scope
- Keeping the old "RPRx Advisor Link" (URL/phone) card in admin — leaving it intact since the toggle still controls dashboard CTA visibility. Tell me if you'd rather replace it entirely.

## Files
- edit: `src/components/dashboard/AdvisorCTACard.tsx`, `src/components/admin/FeaturesTab.tsx`, `src/App.tsx`, possibly `src/components/layout/AppSidebar.tsx`
- new: `src/pages/VirtualAdvisor.tsx`, `src/hooks/useAdvisorEmbed.ts`
