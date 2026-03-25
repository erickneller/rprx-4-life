

# User Dashboard Card Reordering via Drag & Drop

## Approach
Store per-user card order in a new `user_dashboard_card_order` table. On the dashboard, wrap cards in a drag-and-drop container. Users can reorder but not hide cards. If no custom order exists, fall back to the admin-defined `dashboard_card_config.sort_order`.

## Database

### New table: `user_dashboard_card_order`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid references auth.users |
| card_id | text (matches dashboard_card_config.id) |
| sort_order | integer |
| unique(user_id, card_id) |

RLS: Users can SELECT/INSERT/UPDATE/DELETE their own rows only.

## Frontend Changes

### 1. Hook: `useUserCardOrder` (new file `src/hooks/useUserCardOrder.ts`)
- Fetches user's custom order from `user_dashboard_card_order`
- Provides a `saveOrder(orderedCardIds: string[])` mutation that upserts all rows
- Exports a `mergeOrder(adminCards, userOrder)` function that applies user sort on top of admin config

### 2. `DashboardCardRenderer.tsx` — add drag-and-drop
- Install `@dnd-kit/core` and `@dnd-kit/sortable` (lightweight, accessible drag-and-drop)
- Wrap visible cards in `DndContext` + `SortableContext`
- Each card gets a drag handle (grip icon, top-right corner)
- On drag end, call `saveOrder()` and optimistically reorder
- No visibility toggles — users only reorder

### 3. `DashboardContent.tsx` — merge user order
- Call `useUserCardOrder()` alongside existing `useDashboardConfig()`
- Pass merged/sorted cards to `DashboardCardRenderer`
- Add a "Reset to Default" button that deletes the user's custom order

## Files to Create
- `src/hooks/useUserCardOrder.ts`
- Migration for `user_dashboard_card_order` table + RLS

## Files to Modify
- `src/components/dashboard/DashboardCardRenderer.tsx` — add dnd-kit drag-and-drop
- `src/components/dashboard/DashboardContent.tsx` — integrate user order hook
- `package.json` — add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

