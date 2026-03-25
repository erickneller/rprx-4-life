

# Admin Panel: Scrollable Tab Bar

## Problem
With 16 tabs, the `TabsList` overflows and gets clipped on the right side. The `flex-wrap` class causes wrapping but it still gets cut off within the fixed layout.

## Fix
Replace `flex-wrap` with a proper horizontal scroll approach:
- Remove `flex-wrap` from the `TabsList`
- Add `w-full justify-start` and `overflow-x-auto` so tabs scroll horizontally
- Wrap it in a `ScrollArea` with `orientation="horizontal"` for a clean scrollbar, or simply style the native overflow

**Modified: `src/pages/AdminPanel.tsx`** (line 382)

```tsx
// Before
<TabsList className="overflow-x-auto flex-wrap">

// After
<TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto py-1">
```

This keeps all tabs in a single scrollable row with no clipping. Single line change.

