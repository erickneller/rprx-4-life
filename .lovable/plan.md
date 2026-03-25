

# Fix Mobile Drag-and-Drop on Dashboard

## Problem
Two issues prevent mobile card reordering:

1. **No touch sensor**: Only `PointerSensor` and `KeyboardSensor` are configured. On mobile, `TouchSensor` from `@dnd-kit/core` is needed for touch-based dragging.

2. **Grip handle invisible on mobile**: The drag handle uses `opacity-0 group-hover:opacity-100`, but mobile has no hover state — the handle is permanently invisible.

## Fix

### `src/components/dashboard/DashboardCardRenderer.tsx`

1. Import and add `TouchSensor` to the sensors array with a `delay` activation constraint (e.g., 250ms hold) to avoid conflicts with scrolling.

2. Change the grip handle visibility from `opacity-0 group-hover:opacity-100` to always visible on mobile: `opacity-100 md:opacity-0 md:group-hover:opacity-100`.

```
sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  useSensor(KeyboardSensor, { ... })
)
```

