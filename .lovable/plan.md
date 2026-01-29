
# Make Radar Chart Grid Lines Darker

## Summary

Update the PolarGrid stroke color in the Horsemen Radar Chart to use a darker, more visible color instead of the current light border color.

---

## Current State

The `PolarGrid` component on line 31 uses `stroke="hsl(var(--border))"` which resolves to a light gray (`214 32% 91%` in light mode), making the grid lines barely visible.

---

## Proposed Change

**File**: `src/components/results/HorsemenRadarChart.tsx`

| Line | Current | New |
|------|---------|-----|
| 31 | `stroke="hsl(var(--border))"` | `stroke="hsl(var(--muted-foreground))"` |

The `--muted-foreground` color (`215 16% 47%` in light mode) provides a medium gray that is visible without being overwhelming, creating clear grid lines while keeping the focus on the data.

---

## Visual Result

The radar chart grid lines (concentric rings and radial lines) will display as a visible medium gray instead of a faint light gray, making it easier to read the chart values at a glance.
