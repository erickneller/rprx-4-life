## Goal

Turn every section of the public landing page (`src/components/landing/LandingPage.tsx`) into an admin-controlled "card":
- Toggle visibility per section
- Edit all text content (headings, body, bullets, button labels)
- Set free-form URLs for every CTA button
- Drag-to-reorder section order

This mirrors the existing dashboard cards pattern (`dashboard_card_config` + `DashboardCardRenderer` + admin DnD).

## Sections in scope

Hero, ProblemSection, SolutionSnapshot, Features, HowItWorks, Testimonials, Stats, ProductDemo, Pricing, ComparisonTable, Integrations, SecuritySection, FAQ, FinalCTA.

(Header and Footer are not "sections" — out of scope for this pass.)

## Data model — new table `landing_card_config`

Mirrors `dashboard_card_config`:

| column | type | purpose |
|---|---|---|
| `id` | text PK | stable slug (`hero`, `final-cta`, …) |
| `component_key` | text | which React component renders it (`Hero`, `Pricing`, …) |
| `display_name` | text | admin label |
| `sort_order` | int | order on page |
| `is_visible` | bool | show/hide |
| `content` | jsonb | all editable strings + button defs |
| `created_at` / `updated_at` | timestamptz | standard |

**RLS**
- SELECT: `anon` + `authenticated` (landing is public)
- INSERT/UPDATE/DELETE: admins only (`has_role(auth.uid(), 'admin')`)

Seed one row per existing section with current hardcoded copy and buttons.

### `content` JSON shape (per card)

A small, predictable schema each section component knows how to read. Example for Hero:

```json
{
  "eyebrow": "AI-Powered Financial Wellness",
  "headline": "Find Your Money Leaks. Fix Them Fast.",
  "subheadline": "...",
  "bullets": ["...", "...", "..."],
  "buttons": [
    { "label": "Start Free Assessment", "url": "/auth", "variant": "primary" },
    { "label": "Watch Demo", "url": "#demo", "variant": "outline" }
  ],
  "trustNote": "No credit card required..."
}
```

Each section uses only the fields it needs (FAQ has `items[]`, Pricing has `plans[]` with their own `buttons`, Stats has `stats[]`, etc.). Defaults live in the seed migration so nothing breaks if a field is missing.

## Frontend changes

### New shared pieces
- `src/lib/landingCards.ts` — type definitions for each section's `content` shape + defaults.
- `src/hooks/useLandingCards.ts` — `useQuery` reads all rows ordered by `sort_order`; `useMutation` hooks: `useUpdateLandingCard` (update content / is_visible / display_name), `useReorderLandingCards`.

### Refactor section components
Each component in `src/components/landing/*.tsx` becomes a pure renderer that takes a `content` prop instead of using hardcoded strings:
- `<Hero content={...} />`, `<Pricing content={...} />`, etc.
- Buttons render from `content.buttons[]` — internal URLs (start with `/` or `#`) use `<Link>` / anchor, external URLs use `<a href target="_blank">`.

### Renderer
- `src/components/landing/LandingCardRenderer.tsx` — takes the ordered, visible cards and renders the right component per `component_key` with its `content`. Returns `null` for unknown keys.
- `src/components/landing/LandingPage.tsx` becomes: `<Header /> <main>{cards.map(render)}</main> <Footer />`.

## Admin UI

New tab `src/components/admin/LandingPageTab.tsx`, wired into `AdminPanel.tsx`:
- DnD list of cards (reuses `@dnd-kit` pattern from `DashboardCardRenderer`) → calls `useReorderLandingCards` on drop.
- Each row: visibility Switch, expand-to-edit panel.
- Edit panel renders a form generated from the card's content schema:
  - Text inputs for strings, Textarea for long copy, repeatable list editor for arrays (bullets, FAQ items, stats, plans, comparison rows).
  - Buttons editor: add/remove/reorder buttons with `label`, `url` (free-form text), `variant` dropdown.
- Save button → `useUpdateLandingCard`. Reset button reverts to seeded defaults.

## Out of scope
- Per-company / per-tier landing variants
- Header / Footer editing
- Image uploads (existing images stay; URL fields are text)
- A visual page builder beyond field-level forms

## Files touched

New:
- `supabase/migrations/<ts>_landing_card_config.sql` (table + RLS + seed)
- `src/lib/landingCards.ts`
- `src/hooks/useLandingCards.ts`
- `src/components/landing/LandingCardRenderer.tsx`
- `src/components/admin/LandingPageTab.tsx`

Edit:
- `src/components/landing/LandingPage.tsx`
- All 14 section components in `src/components/landing/` (refactor to accept `content` prop)
- `src/pages/AdminPanel.tsx` (register new tab)

## Technical notes
- Cast `.from('landing_card_config' as any)` per project convention to avoid TS deep-type errors.
- Landing page must work for logged-out visitors → query uses the anon key (already the default Supabase client).
- Cache landing config with React Query `staleTime: 5 * 60_000` so the public page isn't refetching constantly.
