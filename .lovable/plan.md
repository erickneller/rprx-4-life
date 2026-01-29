
## Goal
Move the “Taxes” and “Education” radar chart axis labels outward (away from the chart), because they’re currently being shifted inward.

## What’s happening now (root cause)
With 4 radar points, Recharts places the axis labels in the order of the `data` array:
- Interest: top
- Taxes: right
- Insurance: bottom
- Education: left

But the current code assumes:
- Taxes is on the left (so it subtracts from `x`)
- Education is on the right (so it adds to `x`)

In reality it’s the opposite, so the offsets push both labels toward the center (inward).

## Change to make
### File
- `src/components/results/HorsemenRadarChart.tsx`

### Update the tick offset directions (swap them)
In the `PolarAngleAxis` `tick` renderer:

- For **Taxes** (right side): move it further right
  - change `offsetX = x - 25` to `offsetX = x + 25`
  - set `textAnchor` to `"start"` so the text grows outward from the point

- For **Education** (left side): move it further left
  - change `offsetX = x + 25` to `offsetX = x - 25`
  - set `textAnchor` to `"end"` so the text grows outward from the point

Keep the existing small vertical offsets for Interest/Insurance as-is.

### Pseudocode of the exact intended logic
```ts
if (payload.value === "Taxes") {
  offsetX = x + 25;
  anchor = "start";
} else if (payload.value === "Education") {
  offsetX = x - 25;
  anchor = "end";
}
```

## Verification steps (what we’ll check after)
1. Open `/results/:id` and confirm:
   - “Taxes” is clearly outside the right-most grid line.
   - “Education” is clearly outside the left-most grid line.
2. Check at 2 sizes:
   - Desktop width
   - Mobile width (since the chart scales and label crowding can change)
3. If still too tight, we’ll bump the horizontal offset from `25` to `32–40` (small increments).

## Edge cases / follow-up improvements (optional if needed)
If the label placement ever changes (e.g., different start angle, re-ordered data), a more robust approach is to compute direction dynamically (push outward based on whether `x` is left/right of chart center). If this becomes necessary, we’ll adjust the tick renderer to use `viewBox` / `cx` if available in the tick props.
