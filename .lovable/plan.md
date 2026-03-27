

# RPRx Partners Section

## Overview
A new page (`/partners`) with dynamic categories and partner cards sourced from the database. Partners can be toggled on/off per company. The page is accessible from the sidebar (controlled by the existing nav visibility system).

## Database

### 1. `partner_categories` table
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | e.g. `insurance`, `tax-prep` |
| name | text | Display name |
| description | text | Optional subtitle |
| sort_order | int | Ordering |
| is_active | boolean | Global toggle |
| created_at | timestamptz | Default now() |

RLS: authenticated can read; admins can manage.

### 2. `partners` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category_id | text FK → partner_categories | |
| name | text | Partner name |
| description | text | Short summary |
| logo_url | text | Optional logo |
| video_url | text | YouTube embed link |
| partner_url | text | Affiliate/partner link |
| sort_order | int | |
| is_active | boolean | Global toggle |
| created_at / updated_at | timestamptz | |

RLS: authenticated can read; admins can manage.

### 3. `company_partner_visibility` table
Per-company toggle to hide specific partners.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| company_id | uuid FK → companies | |
| partner_id | uuid FK → partners | |
| visible | boolean | Default true |

Unique constraint on `(company_id, partner_id)`.
RLS: company admins can manage their rows; members can read their company's rows.

## Frontend

### 4. New page: `src/pages/Partners.tsx`
- Fetches categories + partners
- Filters partners by user's company visibility settings (if they belong to a company)
- Groups partners by category, renders cards with:
  - Name, description, optional logo
  - Embedded YouTube video (if video_url provided)
  - "Visit Partner" button linking to partner_url
- Responsive grid layout

### 5. New hook: `src/hooks/usePartners.ts`
- `usePartnerCategories()` — fetches active categories
- `usePartners()` — fetches active partners, joined with company visibility if user has a company
- `useCompanyPartnerVisibility()` — admin mutation to toggle per-company

### 6. Sidebar entry
- Add `{ title: "RPRx Partners", url: "/partners", icon: Handshake, configId: "item:rprx_partners" }` to the nav items in `AppSidebar.tsx`
- Seed `sidebar_nav_config` with the new item

### 7. Route in `App.tsx`
- Add `/partners` as a protected + wizard-guarded route

### 8. Admin tab: `PartnersTab.tsx`
- CRUD for categories and partners
- Per-company visibility toggles (select a company, then toggle partners on/off)
- Add as new tab in `AdminPanel.tsx` with a `Handshake` icon

## Technical Notes
- Company visibility uses a "whitelist-by-default" pattern: if no row exists in `company_partner_visibility`, the partner is visible. Only explicit `visible = false` rows hide partners.
- Categories are flexible — admins create/edit/delete them at will, no hardcoded list.
- YouTube URLs will be converted to embed format (`youtube.com/embed/VIDEO_ID`) client-side.

