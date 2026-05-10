## Add Virtual Advisor card to the Dashboard

Add a new dashboard card that mirrors the Virtual Advisor page — same title, instructions, and embedded advisor widget — so users can interact with the advisor without leaving the dashboard.

### What to build

1. **New component:** `src/components/dashboard/VirtualAdvisorCard.tsx`
   - Wraps content in the standard dashboard `<Card>` shell (matches other cards like `AdvisorCTACard`).
   - Header row: mic icon (in primary-tinted circle) + title **"Speak With A Virtual Advisor"** + the two instruction lines:
     - "Connect with an advisor right here in the app."
     - "Make sure to allow your computer or phone to use your microphone if prompted."
   - Embed holder: same logic as `src/pages/VirtualAdvisor.tsx` — uses `useAdvisorEmbed()`, parses the embed snippet into a container ref, properly executes `<script>` tags, shows a loader while fetching, and shows the "not configured yet" placeholder when no embed exists.
   - Hides itself entirely when `useAdvisorLink().enabled` is false (consistent with `AdvisorCTACard`), so the card never appears for instances that haven't configured an advisor.

2. **Register the card in the renderer:** `src/components/dashboard/DashboardCardRenderer.tsx`
   - Import `VirtualAdvisorCard`.
   - Add `case 'VirtualAdvisorCard': return <VirtualAdvisorCard />;` to the `renderCard` switch.

3. **Seed the card in the dashboard config table** via a new migration:
   - Insert a row into `dashboard_card_config` with:
     - `component_key = 'VirtualAdvisorCard'`
     - `display_name = 'Virtual Advisor'`
     - `description = 'Talk to your virtual advisor without leaving the dashboard'`
     - `default_size = 'full'`
     - `is_visible = true`
     - `display_order` = next available (after current max)
   - `ON CONFLICT (component_key) DO NOTHING` so it's idempotent.

### Behavior notes

- The card shows up automatically in the admin Dashboard tab (`DashboardTab.tsx`) — admins can hide it, resize it, or reorder it like any other card without further code changes.
- The existing `AdvisorCTACard` (small "Speak With A Virtual Advisor" CTA that links to `/virtual-advisor`) is left untouched. If you'd prefer to replace it with the new full embed card, say the word and I'll hide/remove the CTA in the same change.
- No changes to the `/virtual-advisor` page — it continues to work as a standalone destination.

### Files touched

- **Create:** `src/components/dashboard/VirtualAdvisorCard.tsx`
- **Edit:** `src/components/dashboard/DashboardCardRenderer.tsx` (add import + switch case)
- **Create:** new SQL migration to seed the `dashboard_card_config` row
