

# Fix Mobile Touch Drag on Dashboard Cards

## Problem
The `TouchSensor` is correctly configured, but the browser's native touch-action (scroll) on the grip handle button overrides the drag gesture. The browser intercepts the touch for scrolling before dnd-kit's `TouchSensor` can activate.

## Fix

### `src/components/dashboard/DashboardCardRenderer.tsx`
Add `touch-action: none` style to the drag handle `<button>` in `SortableCard`. This tells the browser not to handle the touch event itself, allowing dnd-kit to capture it for dragging.

**Line 59-66** — Change the button to include inline style:
```tsx
<button
  {...attributes}
  {...listeners}
  className="absolute top-2 right-2 z-10 p-1.5 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing"
  style={{ touchAction: 'none' }}
  aria-label="Drag to reorder"
>
```

Single-line addition. This is the standard fix for dnd-kit touch dragging — without `touch-action: none`, mobile browsers consume touch events for scrolling before the library can process them.

