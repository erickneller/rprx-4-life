
# Move Education and Taxes Labels Outside Grid Lines

## Summary

Adjust the positioning of the "Education" and "Taxes" text labels in the radar chart to push them further outside the grid, improving visibility. Currently all labels sit at the same distance from center, but the top ("Interest") and bottom ("Insurance") labels have natural clearance, while left ("Taxes") and right ("Education") labels overlap with the grid edges.

---

## Technical Approach

The `PolarAngleAxis` custom tick renderer receives `x` and `y` coordinates from Recharts. We can apply an offset to push specific labels (Taxes and Education) further outward based on their position:

- **Taxes** (left side): Shift the `x` position left by ~15 pixels
- **Education** (right side): Shift the `x` position right by ~15 pixels
- Keep **Interest** (top) and **Insurance** (bottom) at their default positions

---

## File Change

**File**: `src/components/results/HorsemenRadarChart.tsx`

| Lines | Change |
|-------|--------|
| 34-56 | Update the custom tick function to calculate position offsets based on label name |

### Updated tick renderer logic:

```tsx
tick={({ x, y, payload }) => {
  const horseman = Object.entries({
    Interest: 'interest',
    Taxes: 'taxes',
    Insurance: 'insurance',
    Education: 'education',
  }).find(([label]) => label === payload.value)?.[1] as HorsemanType;

  const isPrimary = horseman === primaryHorseman;

  // Offset horizontal labels outward for better visibility
  let offsetX = x;
  let offsetY = y;
  if (payload.value === 'Taxes') {
    offsetX = x - 15;
  } else if (payload.value === 'Education') {
    offsetX = x + 15;
  }

  return (
    <text
      x={offsetX}
      y={offsetY}
      textAnchor="middle"
      dominantBaseline="middle"
      className={isPrimary ? 'fill-primary font-semibold' : 'fill-muted-foreground'}
      fontSize={14}
    >
      {payload.value}
    </text>
  );
}}
```

---

## Visual Result

The "Taxes" label on the left and "Education" label on the right will be pushed ~15 pixels outward, placing them clearly outside the grid lines and preventing overlap with the chart data area.
