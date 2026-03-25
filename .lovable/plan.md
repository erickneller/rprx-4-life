

# "Speak with an RPRx Advisor" — Admin-Configurable CTA

## What We're Building
A persistent "Speak with an RPRx Advisor" link that appears in the sidebar and as a dashboard card. The URL/phone number is admin-configurable from the Features tab. Supports both external URLs and `tel:` phone links.

## Approach

### 1. Store the advisor link in `feature_flags`

Insert a new row into `feature_flags` with id `advisor_link` storing the URL in a new `value` column (text). We need to add a `value` text column to the `feature_flags` table so it can hold arbitrary config strings alongside the boolean `enabled` toggle.

**Migration:**
```sql
ALTER TABLE public.feature_flags ADD COLUMN value text DEFAULT '';

INSERT INTO public.feature_flags (id, enabled, value)
VALUES ('advisor_link', true, 'https://calendly.com/your-link')
ON CONFLICT (id) DO NOTHING;
```

### 2. Create `useAdvisorLink` hook

**New file: `src/hooks/useAdvisorLink.ts`**

Fetches the `advisor_link` flag row, returns `{ enabled, url, isLoading }`. The hook reads both `enabled` (show/hide the CTA) and `value` (the URL or tel: number).

### 3. Add admin controls to FeaturesTab

**Modified: `src/components/admin/FeaturesTab.tsx`**

Add a third Card section: "RPRx Advisor Link" with:
- An enable/disable Switch (toggles visibility app-wide)
- A text Input for the URL/phone number
- A Save button that updates the `value` column
- Helper text: "Enter a URL (e.g. Calendly link) or phone number (will auto-format as tel: link)"

### 4. Add sidebar item

**Modified: `src/components/layout/AppSidebar.tsx`**

Below the nav items group (My Assessments / My Plans / My Profile) and above the Company/Admin sections, add a conditionally-rendered sidebar item:
- Icon: `Phone` from lucide-react
- Label: "Speak with an Advisor"
- Opens `advisor_url` in a new tab (`window.open`)
- Only shown when `advisor_link` flag is enabled and URL is non-empty
- Styled with a subtle accent to stand out (e.g., `text-primary` coloring)

### 5. Add dashboard card

**New file: `src/components/dashboard/AdvisorCTACard.tsx`**

A small card with:
- Phone icon + "Speak with an RPRx Advisor" heading
- Brief subtitle: "Get personalized guidance from a financial advisor"
- Button that opens the configured link in a new tab
- Only renders when advisor_link flag is enabled

**Modified: `src/components/dashboard/DashboardCardRenderer.tsx`**

Register the new card component in the card renderer map so it can be placed via the dashboard card config system.

**Insert a row** into `dashboard_card_config` for the new advisor card.

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `value` column to `feature_flags`, seed `advisor_link` row |
| Insert | New row in `dashboard_card_config` for advisor card |
| New | `src/hooks/useAdvisorLink.ts` |
| New | `src/components/dashboard/AdvisorCTACard.tsx` |
| Modified | `src/components/admin/FeaturesTab.tsx` — add advisor link config card |
| Modified | `src/components/layout/AppSidebar.tsx` — add sidebar item |
| Modified | `src/components/dashboard/DashboardCardRenderer.tsx` — register card |

