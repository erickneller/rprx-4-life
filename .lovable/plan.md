

# Admin-Controlled Sidebar Item Visibility

## Overview
Add a new section to the existing **Features** admin tab (or a dedicated "Navigation" tab) that lets admins show/hide each sidebar nav item and section heading. Uses the existing `feature_flags` table pattern.

## Approach

### 1. Database: New `sidebar_nav_config` table
```sql
CREATE TABLE public.sidebar_nav_config (
  id text PRIMARY KEY,          -- e.g. 'section:financial_stability', 'item:debt_eliminator'
  label text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sidebar_nav_config ENABLE ROW LEVEL SECURITY;
-- Admins can manage, all authenticated can read
CREATE POLICY "Anyone can read nav config" ON public.sidebar_nav_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage nav config" ON public.sidebar_nav_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

Seed rows for every current section heading and nav item (Dashboard, Financial Stability header, Debt Elimination System, Cash Flow Control System, etc.).

### 2. New hook: `useSidebarConfig.ts`
- Fetches all rows from `sidebar_nav_config` (cached via react-query)
- Exports a `useUpdateNavVisibility` mutation for the admin toggle
- Exports a helper `isVisible(id: string): boolean`

### 3. Update `AppSidebar.tsx`
- Call `useSidebarConfig()` to get visibility map
- Filter `sections` and their `items` arrays based on visibility
- Hide section headers when their `section:*` flag is false
- Always show Dashboard (non-hideable) as a safeguard

### 4. New admin component: `NavigationTab.tsx`
- Lists all sidebar sections and items in a structured list
- Each row has: label (read-only), visible toggle (Switch)
- Grouped by section with section-level toggles that also toggle all children
- Add this as a new tab in `AdminPanel.tsx` with a `Navigation` icon

### 5. Wire into `AdminPanel.tsx`
- Import `NavigationTab`, add tab trigger with `PanelLeft` icon labeled "Navigation"

## Technical Details
- Section IDs follow pattern `section:financial_stability`, item IDs follow `item:debt_eliminator`
- The sidebar hook uses a simple `Map<string, boolean>` for O(1) lookups
- Items marked `comingSoon` can also be hidden entirely via this system
- Core items (Dashboard, Profile) can be marked as non-hideable in the admin UI

