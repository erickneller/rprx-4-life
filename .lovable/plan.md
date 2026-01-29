

# Fix Education Label Being Cut Off

## Problem

The "Education" label on the left side is being clipped by the SVG container bounds. The text shows as "cation" instead of "Education" because:
- The label is positioned at the left edge of the chart
- Moving it further left (`offsetX = x - 25`) with `textAnchor="end"` causes the text to extend beyond the SVG viewbox

## Solution

Reduce the radar chart's `outerRadius` from `70%` to `60%` to create more padding around the edges for labels. This gives an additional 10% (5% per side) of space for labels to render without being clipped.

---

## File Change

**File**: `src/components/results/HorsemenRadarChart.tsx`

| Line | Current | New |
|------|---------|-----|
| 30 | `outerRadius="70%"` | `outerRadius="60%"` |

---

## Visual Result

- The radar chart will be slightly smaller
- All four labels (Interest, Taxes, Insurance, Education) will have adequate space
- "Education" will display fully without being cut off

---

## Alternative if needed

If 60% feels too small, we can try 65% as a middle ground. Another option is to add `overflow: visible` to the SVG, but reducing the radius is cleaner and ensures consistent rendering across browsers.

