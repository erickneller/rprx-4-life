

# Change Radar Chart Color to Blue

## Summary

Update the Horsemen Radar Chart to use the Cobalt blue accent color instead of the current dark gray primary color, matching the application's blue theme.

---

## Current State

The radar chart uses `hsl(var(--primary))` which resolves to:
- **Light mode**: Deep slate `222 47% 11%` (appears dark gray)
- **Dark mode**: Teal green `160 84% 45%`

## Proposed Change

Switch to `hsl(var(--accent))` which is the Cobalt blue theme color:
- **Light mode**: `220 90% 51%` (bright Cobalt blue)
- **Dark mode**: `220 90% 60%` (slightly lighter Cobalt blue)

---

## File Changes

**File**: `src/components/results/HorsemenRadarChart.tsx`

| Line | Current | New |
|------|---------|-----|
| 61 | `stroke="hsl(var(--primary))"` | `stroke="hsl(var(--accent))"` |
| 62 | `fill="hsl(var(--primary))"` | `fill="hsl(var(--accent))"` |

The change affects both the stroke (outline) and fill (interior) of the radar polygon, making it a consistent Cobalt blue that matches buttons and accent elements throughout the app.

---

## Visual Result

The radar chart will display with a bright blue fill and outline instead of dark gray, creating visual consistency with:
- CTA buttons
- Links and highlights
- The accent color used in the landing page
- The primary horseman label (which already uses accent styling)

