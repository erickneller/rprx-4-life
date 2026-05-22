## Add Custom Dashboard Cards (with company + subscription targeting)

Enable the "Add Custom Card" button so admins can create their own dashboard cards (video, embed, text, image), targeted to specific companies and/or subscription tiers.

### 1. Migration (run on approval)

Extend `dashboard_card_config`:
- `is_custom boolean default false`
- `title text` (heading for custom cards)
- `content_type text` — `video` | `embed` | `text` | `image` (CHECK constraint)
- `content jsonb default '{}'` — shape per type:
  - video: `{ url, caption? }` (uses existing `VideoPlayer`)
  - embed: `{ html }` (sanitized HTML; iframes allowlisted)
  - text: `{ markdown }` (react-markdown)
  - image: `{ url, alt?, link? }`
- `audience_company_ids uuid[] default '{}'` — empty = all companies
- `audience_tiers text[] default '{}'` — empty = all tiers (`free` / `paid`)

RLS unchanged (admins manage, all signed-in users read). Audience filtering happens client-side in the renderer.

### 2. Hook changes — `src/hooks/useDashboardConfig.ts`

- Add new fields to `DashboardCardConfig` type.
- Add `useCreateCustomCard`, `useDeleteCustomCard`.
- Extend `useUpdateCardConfig` to also accept `title / content_type / content / audience_*`.

### 3. Admin UI — `src/components/admin/DashboardTab.tsx`

- Enable "Add Custom Card" button → opens `CustomCardDialog`.
- Dialog fields: Title, Content type (video/embed/text/image), dynamic content fields, size, **Visible to companies** (multi-select using existing `companies` list, empty = all), **Visible to tiers** (checkbox: Free / Paid, empty = all).
- For custom rows add Edit (pencil) + Delete buttons; built-in rows unchanged.
- Image content uses URL input (reuse motivation-images bucket if user uploads later; v1 accepts a URL/upload via existing helper).

### 4. Renderer — `src/components/dashboard/DashboardCardRenderer.tsx` + new `CustomCard.tsx`

- New `src/components/dashboard/CustomCard.tsx` accepts the row and renders by `content_type`:
  - video → `<VideoPlayer />`
  - image → `<img>` (wrapped in `<a>` if `link` provided)
  - text → react-markdown (already installed)
  - embed → DOMPurify-sanitized HTML, iframes allowlisted to YouTube, Loom, Vimeo, Calendly, GHL, common form providers
- Renderer: when `card.is_custom` or `component_key === 'CustomCard'`, render `<CustomCard card={card} />`.
- Audience filter applied before rendering: hide card if `audience_company_ids` non-empty and user's company not included; hide if `audience_tiers` non-empty and user's tier not included. Uses existing `useCompany()` and `useSubscription()`.

### 5. Result

Admins click "Add Custom Card", pick type, paste content, optionally restrict to specific companies and/or Free/Paid tiers. Card appears on matching users' dashboards alongside built-ins, with the same reorder/hide behavior. Admins toggle the platform-wide visibility switch to hide for everyone.
